export function getUserRole() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("userRole")
}

export function getUserEmail() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("userEmail")
}

export function getUserName() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("userName")
}

export function getUserSurname() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("userSurname")
}

export function getUserId() {
  if (typeof window === "undefined") return null
  const id = localStorage.getItem("userId")
  return id ? Number(id) : null
}