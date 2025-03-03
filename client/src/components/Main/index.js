import React, { Fragment } from 'react'
import { Query } from 'react-apollo'

import NavBar from '../../components/NavBar'
import SideBar from '../../components/SideBar'

import { withAuth } from '../../hocs/PrivateRoute'
import { User } from '../../queries'

import '../../index.css'

const Main = props => (
  <Fragment>
    <Query query={User}>
      {({ loading, error, data }) => {
        if (loading) return 'Loading...'
        if (error) return `Error! ${error.message}`
        return <SideBar {...data.me} />
      }}
    </Query>
    <NavBar />
    {props.children}
  </Fragment>
)

export default withAuth(Main)
