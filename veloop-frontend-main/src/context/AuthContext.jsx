import { createContext, useContext, useEffect, useState } from "react"
import api from "../lib/axios"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [accessToken, setAccessToken] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function restore_session() {
            try {
                const res = await api.post("/auth/refresh-token")
                const token = res.data.data.access_token
                api.defaults.headers.common["Authorization"] = `Bearer ${token}`
                setAccessToken(token)
            } catch (refreshErr) {
                console.log("No existing session found. Please log in.")
            } finally {
                setLoading(false)
            }
        }
        restore_session()
    }, [])

    const login = async (email, password) => {
        try {
            const res = await api.post("/auth/login", { email, password })
            const token = res.data.data.access_token
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`
            setAccessToken(token)
            return { success: true }
        } catch (err) {
            return { success: false, message: err.response?.data?.message }
        }
    }

    const register = async (email, password) => {
        try {
            const res = await api.post("/auth/register", { email, password })
            return { success: true, message: res.data?.message }
        } catch (err) {
            return { success: false, message: err.response?.data?.message || err.message }
        }
    }

    const logout = async () => {
        try {
            await api.post("/auth/logout")
        } catch (err) {
            console.error("LOGOUT ERROR", err)
        } finally {
            delete api.defaults.headers.common["Authorization"]
            setAccessToken(null)
        }
    }

    return (
        <AuthContext.Provider value={{ accessToken, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}