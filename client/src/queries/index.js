import gql from 'graphql-tag'

export const register = gql`
  mutation register(
    $email: String!
    $password1: String!
    $password2: String!
    $fullName: String!
  ) {
    register(
      email: $email
      password1: $password1
      password2: $password2
      fullName: $fullName
    ) {
      error {
        __typename
        ... on ValidationErrors {
          validationErrors {
            field
            messages
          }
        }
      }
      success
      token
      user {
        id
        email
        fullName
      }
    }
  }
`

export const login = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      error {
        __typename
        ... on ValidationErrors {
          validationErrors {
            field
            messages
          }
        }
      }
      token
      user {
        id
        email
        fullName
      }
    }
  }
`

export const editUser = gql`
  mutation editUser($fullName: String, $email: String!, $avatar: String) {
    editUser(fullName: $fullName, email: $email, avatar: $avatar) {
      error {
        __typename
        ... on ValidationErrors {
          validationErrors {
            field
            messages
          }
        }
      }
      user {
        id
        fullName
        email
        avatar
      }
    }
  }
`

export const verifyToken = gql`
  mutation verifyToken($token: String!) {
    verifyToken(token: $token) {
      payload
    }
  }
`

export const getUsers = gql`
  query getUsers {
    users {
      id
      fullName
      email
    }
  }
`

export const getRoom = gql`
  query getRoom($id: Int) {
    room(id: $id) {
      users {
        id
        fullName
      }
      messages {
        id
        text
        sender {
          id
          fullName
        }
        time
      }
    }
  }
`

export const getRooms = gql`
  query getRooms {
    rooms {
      id
      users {
        fullName
      }
    }
  }
`

export const createMessage = gql`
  mutation createMessage($text: String!, $sender: ID!, $room: ID!) {
    createMessage(text: $text, sender: $sender, room: $room) {
      message {
        id
        text
      }
      error {
        __typename
        ... on ValidationErrors {
          validationErrors {
            field
            messages
          }
        }
      }
    }
  }
`

export const updateMessage = gql`
  mutation updateMessage(
    $text: String!
    $sender: ID!
    $room: ID!
    $messageId: Int
  ) {
    updateMessage(
      text: $text
      sender: $sender
      room: $room
      messageId: $messageId
    ) {
      message {
        id
        text
      }
      error {
        __typename
        ... on ValidationErrors {
          validationErrors {
            field
            messages
          }
        }
      }
    }
  }
`

export const deleteTask = gql`
  mutation deleteTask($taskId: String) {
    deleteTask(taskId: $taskId) {
      success
    }
  }
`

export const User = gql`
  query me {
    me {
      id
      email
      fullName
      avatar
    }
  }
`

export const confirmEmail = gql`
  mutation confirmEmail($email: String!) {
    confirmEmail(email: $email) {
      success
      error {
        __typename
        ... on ValidationErrors {
          validationErrors {
            field
            messages
          }
        }
      }
    }
  }
`

export const resetPassword = gql`
  mutation resetPassword(
    $newPassword1: String!
    $newPassword2: String!
    $confirmToken: String!
    $userId: Int!
  ) {
    resetPassword(
      newPassword1: $newPassword1
      newPassword2: $newPassword2
      confirmToken: $confirmToken
      userId: $userId
    ) {
      success
      error {
        __typename
        ... on ValidationErrors {
          validationErrors {
            field
            messages
          }
        }
      }
    }
  }
`

export const countSeconds = gql`
  subscription {
    countSeconds
  }
`

export const newMessageSubscription = gql`
  subscription {
    newMessage {
      id
      text
      time
      sender {
        id
        fullName
      }
    }
  }
`
