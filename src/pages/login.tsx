import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import type { LoginCredentials } from '../store/auth/authSlice';
import { loginThunk } from '../store/auth/authSlice';
import { Button, Container, Paper, Stack, TextField, Typography } from '@mui/material';

export const LoginPage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { isSubmitting, error } = useAppSelector((state) => state.auth);

    const [formData, setFormData] = useState<LoginCredentials>({
        username: '',
        password: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    async function handleSubmit(event) {
        event.preventDefault();

        try {
            await dispatch(loginThunk(formData)).unwrap();
            navigate('/items');
        } catch {
            // The slice stores the displayable error.
        }
    }

    return (
        <Container maxWidth="sm">
            <Paper elevation={8} sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: '800' }}>Login</Typography>
                <Stack component="form" spacing={2} onSubmit={handleSubmit}>
                    <TextField id="outlined-basic" label="Username" variant="outlined" name="username" value={formData.username} onChange={handleChange} />
                    <TextField id="outlined-basic" label="Password" variant="outlined" name="password" value={formData.password} onChange={handleChange} />
                    <Button variant="contained" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Logging in...' : 'Login'}</Button>
                    {error && <Typography color="error">{error}</Typography>}
                </Stack>
            </Paper>
        </Container>
    );
};