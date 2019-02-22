import React, { useState } from 'react'
import { Query, Mutation } from 'react-apollo'

import { getRoom, newMessageSubscription, deleteMessage } from '../../queries'

import UserInfo from '../../components/UserProfile'
import CreateMessageForm from '../../components/Forms/CreateMessageForm'
import ModalForm from '../../components/Forms/ModalForm'
import EditMessageForm from '../../components/Forms/EditMessageForm'

const Room = props => {
  const [modal, setModal] = useState()

  const currentRoom = props.match.params.id

  const subscribeToNewMessage = subscribeToMore => {
    subscribeToMore({
      document: newMessageSubscription,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev
        const newMessage = subscriptionData.data.newMessage

        return Object.assign({}, prev, {
          room: {
            messages: [...prev.room.messages, newMessage],
            users: prev.room.users,
            __typename: prev.room.__typename
          }
        })
      }
    })
  }

  return (
    <Query query={getRoom} variables={{ id: currentRoom }}>
      {({ loading, error, data, subscribeToMore }) => {
        if (loading) return null
        if (error) return `Error! ${error.message}`

        subscribeToNewMessage(subscribeToMore)

        return (
          <article className="feed">
            <CreateMessageForm currentRoom={currentRoom} {...data.room} />
            {data.room.messages.map(i => (
              <div className="content mt-3" key={i.id}>
                <article className="card-shadow rad">
                  <section className="flex-space">
                    <h4>{i.text}</h4>
                    <div>
                      <button
                        className="btn-rounded rad"
                        onClick={() => setModal(i.id)}
                      >
                        Edit
                      </button>
                      <Mutation
                        mutation={deleteMessage}
                        variables={{ messageId: parseInt(i.id) }}
                        refetchQueries={[
                          {
                            query: getRoom,
                            variables: { id: currentRoom }
                          }
                        ]}
                      >
                        {deleteMessage => (
                          <button
                            className="btn-rounded rad"
                            onClick={deleteMessage}
                          >
                            Delete
                          </button>
                        )}
                      </Mutation>
                    </div>
                  </section>
                  <ModalForm
                    title={'Edit message'}
                    isActive={i.id === modal}
                    closeModal={setModal}
                  >
                    <EditMessageForm
                      {...i}
                      currentRoom={currentRoom}
                      closeModal={setModal}
                    />
                  </ModalForm>
                  <span className="mr-3">{i.sender.fullName}</span>
                  <time>{i.time}</time>
                </article>
              </div>
            ))}
            <div className="bar-right position-fixed">
              <UserInfo profile={data.room.users[1]} />
            </div>
          </article>
        )
      }}
    </Query>
  )
}

export default Room
