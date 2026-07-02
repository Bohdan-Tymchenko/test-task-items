import { Button, Container, Paper, Typography } from "@mui/material";
import { logout } from "../store/auth/authSlice";
import { useAppDispatch } from "../store/hooks";
import { useNavigate } from "react-router-dom";

export const ItemsPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    return (
        <Container maxWidth="sm">
            <Paper elevation={8} sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: '800' }}>Items</Typography>
                <Button variant="contained" color="error"
                    onClick={() => {
                        dispatch(logout());
                        navigate('/login');
                    }}
                >
                    Logout
                </Button>
            </Paper>
        </Container>
    );
};
