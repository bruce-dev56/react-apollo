import asyncio
import json
from inspect import isawaitable

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.conf import settings
from graphene_django.settings import graphene_settings
from graphql.execution.executors.asyncio import AsyncioExecutor
from graphql_ws_django.base import (BaseConnectionContext,
                                    BaseSubscriptionServer,
                                    ConnectionClosedException)
from graphql_ws_django.constants import (GQL_COMPLETE, GQL_CONNECTION_ACK,
                                         GQL_CONNECTION_ERROR)
from graphql_ws_django.observable_aiter import setup_observable_extension

setup_observable_extension()


class JSONPromiseEncoder(json.JSONEncoder):
    def encode(self, *args, **kwargs):
        self.pending_promises = []
        return super(JSONPromiseEncoder, self).encode(*args, **kwargs)

    def default(self, o):
        if isinstance(o, Promise):
            if o.is_pending:
                self.pending_promises.append(o)
            return o.value
        return super(JSONPromiseEncoder, self).default(o)


class ChannelsConnectionContext(BaseConnectionContext):
    async def send(self, data):
        await self.ws.send_json(data)

    async def close(self, code):
        await self.ws.close(code=code)


class ChannelsSubscriptionServer(BaseSubscriptionServer):
    def get_graphql_params(self, connection_context, payload):
        payload["context"] = connection_context.request_context
        params = super(ChannelsSubscriptionServer, self).get_graphql_params(
            connection_context, payload
        )
        return dict(params, return_promise=True, executor=AsyncioExecutor())

    async def handle(self, ws, request_context=None):
        connection_context = ChannelsConnectionContext(ws, request_context)
        await self.on_open(connection_context)
        return connection_context

    async def send_message(
        self, connection_context, op_id=None, op_type=None, payload=None
    ):
        message = {}
        if op_id is not None:
            message["id"] = op_id
        if op_type is not None:
            message["type"] = op_type
        if payload is not None:
            message["payload"] = payload

        assert message, "You need to send at least one thing"
        return await connection_context.send(message)

    async def on_open(self, connection_context):
        pass

    async def on_connect(self, connection_context, payload):
        pass

    async def on_connection_init(self, connection_context, op_id, payload):
        try:
            await self.on_connect(connection_context, payload)
            await self.send_message(connection_context, op_type=GQL_CONNECTION_ACK)
        except Exception as e:
            await self.send_error(connection_context, op_id, e, GQL_CONNECTION_ERROR)
            await connection_context.close(1011)

    async def on_start(self, connection_context, op_id, params):
        execution_result = self.execute(
            connection_context.request_context, params)

        if isawaitable(execution_result):
            execution_result = await execution_result

        if hasattr(execution_result, "__aiter__"):
            iterator = await execution_result.__aiter__()
            connection_context.register_operation(op_id, iterator)
            async for single_result in iterator:
                if not connection_context.has_operation(op_id):
                    break
                await self.send_execution_result(
                    connection_context, op_id, single_result
                )
        else:
            await self.send_execution_result(
                connection_context, op_id, execution_result
            )
        await self.on_operation_complete(connection_context, op_id)

    async def on_close(self, connection_context):
        unsubscribes = [
            self.unsubscribe(connection_context, op_id)
            for op_id in connection_context.operations
        ]
        if unsubscribes:
            await asyncio.wait(unsubscribes)

    async def on_stop(self, connection_context, op_id):
        await self.unsubscribe(connection_context, op_id)

    async def unsubscribe(self, connection_context, op_id):
        if connection_context.has_operation(op_id):
            op = connection_context.get_operation(op_id)
            op.dispose()
            connection_context.remove_operation(op_id)
        await self.on_operation_complete(connection_context, op_id)

    async def on_operation_complete(self, connection_context, op_id):
        await self.send_message(connection_context, op_id, GQL_COMPLETE)


subscription_server = ChannelsSubscriptionServer(
    schema=graphene_settings.SCHEMA
)


class GraphQLSubscriptionConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.accept(subprotocol='graphql-ws')

        self.subscription_server = ChannelsSubscriptionServer(
            schema=graphene_settings.SCHEMA
        )
        self.connection_context = await self.subscription_server.handle(
            ws=self, request_context=self.scope
        )

    async def disconnect(self, content):
        if self.connection_context:
            await subscription_server.on_close(self.connection_context)

    async def receive_json(self, content):
        asyncio.ensure_future(
            subscription_server.on_message(self.connection_context, content)
        )

    @classmethod
    async def encode_json(cls, content):
        json_promise_encoder = JSONPromiseEncoder()
        e = json_promise_encoder.encode(content)
        while json_promise_encoder.pending_promises:
            await asyncio.wait(json_promise_encoder.pending_promises)
            e = json_promise_encoder.encode(content)
        return e
