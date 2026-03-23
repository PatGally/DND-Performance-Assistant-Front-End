import {ArrowRight, ArrowRightShort} from "react-bootstrap-icons";
import {Button, Form, Row, Col, Container} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import logo from '../components/nav/logo1.png'
import { signup } from "../api/SignUpPost.ts";
import {googleLogin} from '../api/GoogleLogin.ts'

import {Link} from "react-router-dom";
import { useForm, type SubmitHandler } from "react-hook-form";
import React from "react";

import {z} from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { uuidPolyfill } from '../api/uuidPolyfill.ts';

import { GoogleLogin } from '@react-oauth/google';

// Todo Add api to send user credentials
// Todo Add redirect to user dashboard

uuidPolyfill();

const schema= z.object({
    email: z.string()
        .email()
        .min(1, "Email is required"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[@$!%*?&]/, "Password must contain at least one special character"),
    username: z.string()
        .regex(
            /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/, "Invalid username"
        )
})
type FormFields = z.infer<typeof schema>;


const SignUpPage: React.FC = () => {
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        setError,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormFields>({
        defaultValues: { email: ""},

        resolver: zodResolver(schema),
        mode: "onChange",
    });

    const onSubmit: SubmitHandler<FormFields> = async (userData) => {
        if (!userData.email || !userData.password || !userData.username) {
            return;
        }
        const payload = {
            username: userData.username,
            password: userData.password,
            email: userData.email
        }
        try {
            await signup(payload);
            console.log(userData);
            reset();
            navigate("/user-dashboard")
        } catch (error) {
            setError("root", {
                message: "This email is already taken",
            });
        }
        // console.log(payload);
    }

    return (
        <>
            <Container fluid className="d-flex flex-column min-vh-100 p-0">
                <Row>
                    <Col md={6} lg={6} xl={6} xxl={6} className="text-center align-items-center bg-dark bg-gradient text-light min-vh-50 min-vh-md-100">
                        <Row className="m-3 ">
                            <div className="mt-5"> <h2>Create your account for free</h2> </div>
                            <div> Explore our app </div>
                            <span>
                                <img
                                    src={logo}
                                    alt="Company Logo"
                                    style={{ height: "80px" }}
                                />
                            </span>

                        </Row>
                    </Col>
                    <Col md={6} lg={6} xl={6} xxl={6} className="bg-light min-vh-100" >
                        <Row className="mx-auto">
                            <Col>
                                <div className="d-flex m-4">
                                    <span className="fs-6">Already have an account? </span>
                                    <Link to="/sign-in" className="d-flex align-items-center ms-2"> Sign In <ArrowRight/></Link>
                                </div>
                            </Col>

                        </Row>
                        <Row className="justify-content-center">
                            <h2 className="w-75">Sign up for dndpa</h2>
                            <div className="justify-content-center w-75 m-3">
                                <GoogleLogin
                                    onSuccess={async (credentialResponse) => {
                                        try {
                                            await googleLogin(credentialResponse.credential!);
                                            navigate("/user-dashboard");
                                        } catch (error) {
                                            console.error("Google sign up failed:", error);
                                        }
                                    }}
                                    onError={() => console.error("Google sign up failed")}
                                />
                            </div>
                            <div className="d-flex align-items-center  w-75 my-3">
                                <hr className="flex-grow-1" />
                                <span className="mx-2 text-muted">or</span>
                                <hr className="flex-grow-1" />
                            </div>
                        </Row>
                        <Row className="justify-content-center">
                            <Form  onSubmit={handleSubmit(onSubmit)} className="w-75">
                                <Form.Group className="mt-3">
                                    <Form.Label>Email*</Form.Label>
                                    <Form.Control
                                        isInvalid={!!errors.email}
                                        {...register("email",)} type="text" placeholder="Email"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.email?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                                <Form.Group className="mt-3">
                                    <Form.Label>Password*</Form.Label>
                                    <Form.Control
                                        isInvalid={!!errors.password}
                                        {...register("password",)} type="text" placeholder="Enter Password"
                                    />
                                    <span className="text-muted small">Password should be at least 8 characters
                                        including a number and a lowercase letter and a special character.</span>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.password?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>
                                <Form.Group className="mt-3">
                                    <Form.Label>Username*</Form.Label>
                                    <Form.Control
                                        isInvalid={!!errors.username}
                                        {...register("username",)} type="text" placeholder="Enter username"
                                    />
                                    <span className="text-muted small">Username may only contain alphanumeric
                                        characters or single hyphens, and cannot begin or end with a hyphen.</span>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.username?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Button type="submit" variant="dark" className="w-100 mt-3" disabled={isSubmitting}>
                                    {isSubmitting ? "Creating..." : "Create Account" }
                                    {!isSubmitting && <ArrowRightShort  />}
                                </Button>
                            </Form>
                        </Row>
                    </Col>
                </Row>
            </Container>
        </>
    )
}

export default SignUpPage;