// LoginPage.js
import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useHistory } from 'react-router-dom';

const LoginPage = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const { login } = useAuth();
  const history = useHistory();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Envoie les informations de connexion au backend
    fetch('http://localhost:8000/api/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })
      .then(response => response.json())
      .then(data => {
        if (data.token) {
          login(data.user);  // Met à jour l'état de l'utilisateur dans le contexte
          history.push('/protected-page');  // Redirige vers la page protégée
        } else {
          alert('Invalid credentials');
        }
      })
      .catch((error) => console.log('Login failed', error));
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={credentials.username}
          onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={credentials.password}
          onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default LoginPage;
