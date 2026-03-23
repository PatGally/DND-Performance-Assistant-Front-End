import {Button, Form, Col, Container} from "react-bootstrap";
import React from "react";
import logo from '../components/nav/logo1.png'
import { login } from "../api/Login.ts"
import {googleLogin} from '../api/GoogleLogin.ts'

import {z} from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { uuidPolyfill } from '../api/uuidPolyfill.ts';
import {type SubmitHandler, useForm} from "react-hook-form";
import {GoogleLogin} from "@react-oauth/google";
import {Link, useNavigate} from "react-router-dom";

uuidPolyfill();

const schema= z.object({
    password: z.string(),
    username: z.string()
})
type FormFields = z.infer<typeof schema>;



const LogInPage: React.FC = () =>{
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        setError,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormFields>({

        resolver: zodResolver(schema),
        mode: "onChange",
    });

    const onSubmit: SubmitHandler<FormFields> = async (userData) => {
        if (!userData.password || !userData.username) {
            return;
        }
        try {
            await login(userData);
            reset();
            navigate("/user-dashboard");
        } catch (error) {
            setError("root", {message: "Incorrect username or password",});
        }
    }

    return (
        <Container fluid className="d-flex justify-content-center bg-dark text-light pt-5 min-vh-100">
            <Col xs={12} md={6} lg={4} className="text-center ">
                <img src={logo} alt="Company Logo" style={{ height: "80px" }} />
                <h4> Sign in to dndnpa</h4>

                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Form.Group className="mt-3 text-start">
                        <Form.Label>Username</Form.Label>
                        <Form.Control
                            isInvalid={!!errors.username}
                            {...register("username")}
                            type="text"
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.username?.message}
                        </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mt-3 text-start">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                            isInvalid={!!errors.password}
                            {...register("password")}
                            type="password"
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.password?.message}
                        </Form.Control.Feedback>
                    </Form.Group>
                    <Button type="submit" className="w-100 mt-4" disabled={isSubmitting}
                            style={{ backgroundColor: "#02590F", borderColor: "#02590F" }}>
                        {isSubmitting ? "Signing in..." : "Sign in" }
                    </Button>
                </Form>

                {errors.root && (
                    <p className="text-danger mt-2">{errors.root.message}</p>
                )}

                {/*Give an id to this or class for this - not happy with bootstrap green color atm*/}
                {/*to remove inline styles*/}


                <div className="d-flex align-items-center my-4">
                    <hr className="flex-grow-1" />
                    <span className="mx-2">or</span>
                    <hr className="flex-grow-1" />
                </div>

                <div className=" w-100 mt-3">
                    <GoogleLogin
                        onSuccess={async (credentialResponse) => {
                            try {
                                await googleLogin(credentialResponse.credential!);
                                navigate("/user-dashboard");
                            } catch (error) {
                                console.error("Google login failed:", error);
                            }
                        }}
                        onError={() => console.error("Google Login Failed")}
                    />
                </div>
                <div className="mt-5">
                    New to dndpa? <Link to="/sign-up" className="text-decoration-none"> Create an account </Link>
                </div>
            </Col>
        </Container>
    )
}

export default LogInPage;