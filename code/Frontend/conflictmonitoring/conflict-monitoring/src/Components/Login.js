import React,{useState} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./Authentication";


function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    // include regex for username and password validation

    const handleLogin = () => {
        fetch('http://127.0.0.1:8080/validate_user', { // Change the URL/port as per your backend configuration
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ "user_id": username, "password": password })
        })
        .then(response => {
            if (!response.ok) {
                // Handle HTTP 400 responses
                return response.json().then(data => {
                    throw new Error(data.message || 'Something went wrong');
                });
            }
            return response.json(); // Return JSON data for HTTP 200 responses
        })
        .then(data => {
            console.log('Login Success:', data);
            login(); // Set the user as authenticated
            navigate('/CountrySelect'); // Navigate to the CountrySelect page
        })
        .catch(error => {
            console.error('Login Error:', error.message);
            setErrorMessage('Username or password is incorrect.'); // Show error message to the user
        });
    };


    return (
        <div className="font-serif" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '150px' }}>
            <div className="text-2xl pb-8">
                <h1>Login</h1>
            </div>
            
            <div className="flex flex-col" >
                <input type="text" placeholder="Username" style={{ width: '200px', marginBottom: '20px' }} onChange={e => setUsername(e.target.value)} className="textarea-bordered border-solid border-black border rounded py-1 px-1"/>
                <input type="password" placeholder="Password" style={{ width: '200px', marginBottom: '20px' }} onChange={e => setPassword(e.target.value)} className="textarea-bordered  border-solid border-black border rounded  py-1 px-1" />
            </div>
            
            <div className="flex flex-col  items-center">
                <button style={{ width: '100px' }} onClick={handleLogin} className="btn mb-2">Login</button>
                {errorMessage && <p>{errorMessage}</p>}
                <a className="link link-neutral" href="/SignUp">Register Instead</a>
            </div>  
        </div>  
    );
}

export default Login;