"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Container,
  InputAdornment,
  IconButton,
  Divider,
  Avatar,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { blue } from "@mui/material/colors";
import api from "@/services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post("/auth/login", { email, password });

      // Check if user is admin
      if (response.data.user.role !== "ADMIN") {
        setError("Access restricted: Admin privileges required");
        setIsLoading(false);
        return;
      }

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      router.push("/dashboard");
    } catch (err) {
      setError("Invalid email or password");
      setIsLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: "100%",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Avatar sx={{ bgcolor: blue[700], mb: 1, width: 56, height: 56 }}>
              <AdminPanelSettingsIcon fontSize="large" />
            </Avatar>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              fontWeight="500"
            >
              Admin Panel
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Админы эрхээр нэвтрэнэ үү!
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box component="form" onSubmit={handleLogin} sx={{ mt: 2 }}>
            <TextField
              label="Email Address"
              variant="outlined"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
              InputProps={{
                sx: { borderRadius: 1 },
              }}
            />
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { borderRadius: 1 },
              }}
              sx={{ mb: 1 }}
            />

            {error && (
              <Typography
                color="error"
                sx={{
                  mt: 1,
                  mb: 1,
                  textAlign: "center",
                  bgcolor: "error.light",
                  color: "error.contrastText",
                  py: 1,
                  px: 2,
                  borderRadius: 1,
                  fontSize: "0.875rem",
                }}
              >
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{
                mt: 2,
                mb: 2,
                py: 1.5,
                borderRadius: 1,
                textTransform: "none",
                fontSize: "1rem",
              }}
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </Box>
        </Paper>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          © {new Date().getFullYear()} Microblog Admin Panel
        </Typography>
      </Box>
    </Container>
  );
}
