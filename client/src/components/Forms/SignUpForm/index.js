import React from "react";
import { Formik, Form, Field } from "formik";
import { Button, MDBCol } from "mdbreact";

import { ReactstrapInput } from "reactstrap-formik";

import { SignupSchema } from "./validation";

export const SignUpForm = props => (
  <MDBCol
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh"
    }}
  >
    <Formik
      initialValues={{
        fullName: "",
        email: "",
        password1: "",
        password2: ""
      }}
      validationSchema={SignupSchema}
      onSubmit={props.register}
    >
      {() => (
        <div className="card" style={{ width: "50%" }}>
          <div className="card-header">Signup</div>
          <div className="card-body">
            <Form>
              <Field
                name="fullName"
                type="text"
                component={ReactstrapInput}
                label="Name"
              />
              <Field
                name="email"
                type="email"
                component={ReactstrapInput}
                label="Email"
              />
              <Field
                name="password1"
                type="password"
                component={ReactstrapInput}
                label="Password"
              />
              <Field
                name="password2"
                type="password"
                component={ReactstrapInput}
                label="Password confirmation"
              />
              <Button type="submit">Submit</Button>
            </Form>
          </div>
        </div>
      )}
    </Formik>
  </MDBCol>
);
