import {Button, Form, Col, Container, InputGroup} from "react-bootstrap";
import {Eye, EyeSlash, ArrowRightShort} from "react-bootstrap-icons";
import React, {useState} from "react";
import d20 from '../assets/d20.png'
import {login} from "../api/Login.ts"
import {googleLogin} from '../api/GoogleLogin.ts'
import "./HomePagePA.css"

import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {uuidPolyfill} from '../api/uuidPolyfill.ts';
import {type SubmitHandler, useForm} from "react-hook-form";
import {GoogleLogin} from "@react-oauth/google";
import {Link, useNavigate} from "react-router-dom";

uuidPolyfill();

const schema = z.object({
    password: z.string(),
    username: z.string()
})
type FormFields = z.infer<typeof schema>;


const LogInPage: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        setError,
        reset,
        formState: {errors, isSubmitting},
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
            setError("root", {message: `Incorrect username or password, error: ${error}`,});
        }
    }
    return (
        <Container fluid className=" text-center d-flex justify-content-center pa-bg-card text-light pt-5 min-vh-100">
            <Col xs={12} md={6} lg={4}>
                <img src={d20} alt="Website Logo" style={{height: "80px"}}/>
                <h4> Sign in to DNDPA</h4>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Form.Group className="mt-3 text-start">
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

                    <Form.Group className="mt-3 text-start">
                        <Form.Label>Password*</Form.Label>
                        <InputGroup hasValidation className="flex-nowrap">
                            <Form.Control
                                isInvalid={!!errors.password}
                                {...register("password")}
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter Password"
                                autoComplete="current-password"
                            />
                            <InputGroup.Text
                                as="button"
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                tabIndex={-1}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                style={{ cursor: "pointer", border: "1px solid #ced4da" }}
                            >
                                {showPassword ? <EyeSlash /> : <Eye />}
                            </InputGroup.Text>
                            <Form.Control.Feedback type="invalid">
                                {errors.password?.message}
                            </Form.Control.Feedback>
                        </InputGroup>
                    </Form.Group>

                    <Button type="submit" variant="dark" className="w-100 mt-3" disabled={isSubmitting}>
                        {isSubmitting ? "Signing in..." : "Sign In"}
                        {!isSubmitting && <ArrowRightShort />}
                    </Button>
                </Form>

                {errors.root && (
                    <p className="text-danger mt-2">{errors.root.message}</p>
                )}

                <div className="d-flex align-items-center my-4">
                    <hr className="flex-grow-1"/>
                    <span className="mx-2">or</span>
                    <hr className="flex-grow-1"/>
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
                    New to DNDPA? <Link to="/sign-up" className="text-decoration-none"> Create an account </Link>
                </div>
            </Col>
        </Container>
    )
}

export default LogInPage;