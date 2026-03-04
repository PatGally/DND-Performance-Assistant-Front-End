import {Button, Form, Col, Container} from "react-bootstrap";
import React from "react";
import logo from '../components/nav/logo.png'

import {z} from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { uuidPolyfill } from '../api/uuidPolyfill.ts';
import {type SubmitHandler, useForm} from "react-hook-form";
import {GoogleLogin} from "@react-oauth/google";
import {Link} from "react-router-dom";

// Todo add error box to inform user about incorrect credentials
// todo Add use state to render error if data is not valid

// Username only


// Todo Add api to send user credentials
// Todo Add redirect to user dashboard

uuidPolyfill();

const schema= z.object({
    email: z.string()
        .email()
        .min(1, "Email is required"),
    password: z.string(),
    username: z.string()
})
type FormFields = z.infer<typeof schema>;



const LogInPage: React.FC = () =>{
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
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            console.log(userData);
        } catch (error) {
            setError("root", {
                message: "This email is already taken",
            });
        }

        const payload = {
            username: userData.username,
            password: userData.password,
            email: userData.email
        }
        reset(); //For

        console.log(payload);
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
                            // isInvalid={!!errors.email}
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
                            // isInvalid={!!errors.password}
                            {...register("password")}
                            type="text"
                        />
                        <Form.Control.Feedback type="invalid">
                            {errors.password?.message}
                        </Form.Control.Feedback>
                    </Form.Group>
                </Form>

                {/*Give an id to this or class for this - not happy with bootstrap green color atm*/}
                {/*to remove inline styles*/}
                <Button type="submit" className="w-100 mt-4" disabled={isSubmitting}
                        style={{ backgroundColor: "#02590F", borderColor: "#02590F" }}>
                    {isSubmitting ? "Signing in..." : "Sign in" }
                </Button>

                <div className="d-flex align-items-center my-4">
                    <hr className="flex-grow-1" />
                    <span className="mx-2">or</span>
                    <hr className="flex-grow-1" />
                </div>

                <div className=" w-100 mt-3">
                    <GoogleLogin
                        onSuccess={credentialResponse => console.log(credentialResponse)}
                        onError={() => console.log('Login Failed')}
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