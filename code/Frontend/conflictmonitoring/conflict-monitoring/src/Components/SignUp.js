import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./Authentication";

function SignUp() {
    const [username, setUsername] = useState('');
    const [firstPassword, setFirstPassword] = useState('');
    const [secondPassword, setSecondPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    // Regex patterns for validation
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // Email regex
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/; // Minimum eight characters, at least one uppercase letter, one lowercase letter and one number


    const handleRegister = () => {
        // Validate email and password
        if (!emailRegex.test(username)) {
            setErrorMessage("Please enter a valid email address.");
            return;
        }
        if (!passwordRegex.test(firstPassword)) {
            setErrorMessage("Password must be at least 8 characters long and include at least one number, one uppercase and one lowercase letter.");
            return;
        }
        if (firstPassword !== secondPassword) {
            setErrorMessage("Passwords do not match.");
            return;
        }

        fetch('http://127.0.0.1:8080/register_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: username, password: firstPassword })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Registration failed');
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Registration Success:', data);
            login();
            navigate('/CountrySelect'); // Navigate to the CountrySelect page
        })
        .catch(error => {
            console.error('Registration Error:', error.message);
            setErrorMessage(error.message || 'Registration failed'); // Show error message to the user
        });
    };

    return (
        <div className="font-serif" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px' }}>
            <div className="text-2xl pb-8">
                <h1>Register</h1>
            </div>

            <div className="flex flex-col">
                <input type="text" placeholder="Email" value={username} onChange={e => setUsername(e.target.value)} style={{ width: '200px', marginBottom: '10px' }} className="textarea-bordered border-solid border-black border rounded py-1 px-1"/>
                <input type="password" placeholder="Password" value={firstPassword} onChange={e => setFirstPassword(e.target.value)} style={{ width: '200px', marginBottom: '10px' }} className="textarea-bordered border-solid border-black border rounded py-1 px-1"/>
                <input type="password" placeholder="Confirm Password" value={secondPassword} onChange={e => setSecondPassword(e.target.value)} style={{ width: '200px', marginBottom: '10px' }} className="textarea-bordered border-solid border-black border rounded py-1 px-1"/>
            </div>

            <div className="flex flex-col  items-center">
                <button style={{ width: '100px' }} onClick={handleRegister} className="btn mt-2 mb-2">Register</button>
                {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
                <a href="/Login" className="link link-neutral">Login Instead</a>
            </div>    
        </div>
    );
}

export default SignUp;
