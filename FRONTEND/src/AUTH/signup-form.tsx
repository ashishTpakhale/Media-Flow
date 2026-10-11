import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useNavigate } from "react-router-dom"
import { API_BASE_URL } from "../../config/config"

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const [form, setForm] = useState({
    displayName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          username: form.username,
          password: form.password,
          displayName: form.displayName,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.message || "Registration failed")
        return
      }

      alert("Account created successfully")
      navigate("/Signin")
    } catch (err) {
      alert("Server not reachable")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card 
      {...props} 
      className="bg-black text-white border-white"
    >
      <CardHeader>
        <CardTitle className="text-white">Create an account</CardTitle>
        <CardDescription className="text-gray-400">
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="displayName" className="text-white">Full Name</FieldLabel>
              <Input
                id="displayName"
                placeholder="John Doe"
                value={form.displayName}
                onChange={handleChange}
                className="bg-zinc-900 border-white text-white placeholder:text-gray-500 focus:border-white"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="username" className="text-white">Username</FieldLabel>
              <Input
                id="username"
                placeholder="johndoe"
                value={form.username}
                onChange={handleChange}
                required
                className="bg-zinc-900 border-white text-white placeholder:text-gray-500 focus:border-white"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="email" className="text-white">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={form.email}
                onChange={handleChange}
                required
                className="bg-zinc-900 border-white text-white placeholder:text-gray-500 focus:border-white"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="password" className="text-white">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                className="bg-zinc-900 border-white text-white placeholder:text-gray-500 focus:border-white"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="confirmPassword" className="text-white">
                Confirm Password
              </FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                className="bg-zinc-900 border-white text-white placeholder:text-gray-500 focus:border-white"
              />
            </Field>

            <Field>
              <Button 
                type="submit" 
                className="w-full bg-white text-black hover:bg-gray-200" 
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
              <FieldDescription className="px-6 text-center text-gray-400">
                Already have an account?{" "}
                <a href="/Signin" className="text-white hover:text-gray-300 underline">
                  Sign in
                </a>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}