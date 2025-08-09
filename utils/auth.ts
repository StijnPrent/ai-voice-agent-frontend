export const isTokenExpired = (token: string): boolean => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const currentTime = Date.now() / 1000
        return payload.exp < currentTime
    } catch (error) {
        return true // If we can't parse the token, consider it expired
    }
}

export const getToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('jwt')
    }
    return null
}

export const isAuthenticated = (): boolean => {
    const token = getToken()
    if (!token) return false
    return !isTokenExpired(token)
}

export const removeToken = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('jwt')
    }
}