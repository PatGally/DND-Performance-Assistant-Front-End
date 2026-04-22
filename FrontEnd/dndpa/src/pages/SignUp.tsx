import { ArrowRight, ArrowRightShort, Eye, EyeSlash } from "react-bootstrap-icons";
import {Button, Form, Row, Col, Container, InputGroup} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import d20 from '../assets/d20.png'
import { signup } from "../api/SignUpPost.ts";
import {googleLogin} from '../api/GoogleLogin.ts'

import "../css/HomePagePA.css"

import {Link} from "react-router-dom";
import { useForm,  type SubmitHandler } from "react-hook-form";
import React from "react";
import {useState} from "react";
import {z} from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { uuidPolyfill } from '../api/uuidPolyfill.ts';

import { GoogleLogin } from '@react-oauth/google';

uuidPolyfill();


const schema = z.object({
    email: z.string()
        .min(1, "Email is required")
        .email("Invalid email address"),
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[@$!%*?&]/, "Password must contain at least one special character"),
    confirmPassword: z.string()
        .min(1, "Please confirm your password"),
    username: z.string()
        .min(3, "Username must be at least 3 characters")
        .max(15, "Username must be at most 15 characters")
        .regex(
            /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/,
            "Username may only contain alphanumeric characters or single hyphens"
        ),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});


type FormFields = z.infer<typeof schema>;


const SignUpPage: React.FC = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const {
        register,
        handleSubmit,
        setError,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormFields>({
        defaultValues: { email: "", password: "", confirmPassword: "", username: ""},
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
            reset();
            navigate("/user-dashboard")
        } catch (error) {
            setError("root.serverError", {
                message: "This email is already taken",
            });
        }
    }


    return (
        <>
            <Container fluid className="d-flex flex-column min-vh-100 p-0 text-dark">
                <Row>
                    <Col md={6} lg={6} xl={6} xxl={6} className="text-center align-items-center pa-bg-card bg-gradient text-light min-vh-50 min-vh-md-100">
                        <Row className="m-3 ">
                            <div className="mt-5"> <h2>Create your account for free</h2> </div>
                            {/*<div> Explore our app </div>*/}
                            <span>
                                <img
                                    src={d20}
                                    alt="website Logo"
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
                            <h2 className="w-75">Sign up for DNDPA</h2>
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
                                        {...register("email")}
                                        type="text"
                                        placeholder="Email"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.email?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Form.Group className="mt-3">
                                    <Form.Label>Password*</Form.Label>
                                    <InputGroup hasValidation>
                                        <Form.Control
                                            isInvalid={!!errors.password}
                                            {...register("password")}
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter Password"
                                        />
                                        <Button
                                            variant="outline-secondary"
                                            type="button"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            tabIndex={-1}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeSlash /> : <Eye />}
                                        </Button>
                                        <Form.Control.Feedback type="invalid">
                                            {errors.password?.message}
                                        </Form.Control.Feedback>
                                    </InputGroup>
                                    <span className="text-muted small">Password should be at least 8 characters including a number,
                                        an uppercase letter, and a special character (@$!%*?&).</span>
                                </Form.Group>

                                <Form.Group className="mt-3">
                                    <Form.Label>Confirm Password*</Form.Label>
                                    <InputGroup hasValidation>
                                        <Form.Control
                                            isInvalid={!!errors.confirmPassword}
                                            {...register("confirmPassword")}
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Re-enter Password"
                                        />
                                        <Button
                                            variant="outline-secondary"
                                            type="button"
                                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                                            tabIndex={-1}
                                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                        >
                                            {showConfirmPassword ? <EyeSlash /> : <Eye />}
                                        </Button>
                                        <Form.Control.Feedback type="invalid">
                                            {errors.confirmPassword?.message}
                                        </Form.Control.Feedback>
                                    </InputGroup>
                                </Form.Group>

                                <Form.Group className="mt-3">
                                    <Form.Label>Username*</Form.Label>
                                    <Form.Control
                                        isInvalid={!!errors.username}
                                        {...register("username")}
                                        type="text"
                                        placeholder="Enter username"
                                        maxLength={15}
                                    />
                                    <span className="text-muted small">
                                        Username must be 3–15 characters,
                                        alphanumeric or single hyphens,
                                        and cannot begin or end with a hyphen.
                                    </span>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.username?.message}
                                    </Form.Control.Feedback>
                                </Form.Group>

                                <Button type="submit" variant="dark" className="w-100 mt-3" disabled={isSubmitting}>
                                    {isSubmitting ? "Creating..." : "Create Account"}
                                    {!isSubmitting && <ArrowRightShort />}
                                </Button>
                                <h5 className="mt-5 text-center">Privacy & Data Protection</h5>

                                <p>
                                    Your privacy matters to us. We are committed to protecting your personal information and being transparent about how it is handled.
                                </p>

                                <ul>
                                    <li>We <strong>do not sell, trade, or rent</strong> your personal information to third parties.</li>
                                    <li>Your data is used solely to provide and improve our services.</li>
                                    <li>We implement appropriate security measures to help protect your information from unauthorized access, alteration, or disclosure.</li>
                                    <li>Any data collected is limited to what is necessary for functionality and user experience.</li>
                                    <li>We do not share your information unless required by law or with your explicit consent.</li>
                                </ul>

                                <p>
                                    By using our platform, you can trust that your data is handled responsibly and with care.
                                </p>
                            </Form>
                        </Row>
                    </Col>
                </Row>
            </Container>
        </>
    )
}

export default SignUpPage;