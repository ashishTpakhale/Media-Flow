import { cn } from "@/lib/utils"
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
import axios from "axios"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { API_BASE_URL } from "../../config/config"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await axios.post(`${API_BASE_URL}/login`, {
        email,
        password,
      })

      const { user, token } = res.data

      if (token && user) {
        localStorage.setItem("token", token) 
        localStorage.setItem("user", JSON.stringify(user))

        navigate("/") // Home
      } else {
        alert("Invalid login response")
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-black text-white border-white">
        <CardHeader>
          <CardTitle className="text-white">Login to your account</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email" className="text-white">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-zinc-900 border-white text-white placeholder:text-gray-500 focus:border-white"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password" className="text-white">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  {loading ? "Logging in..." : "Login"}
                </Button>

                <FieldDescription className="text-center text-gray-400">
                  Don&apos;t have an account?{" "}
                  <a href="/Signup" className="underline text-white hover:text-gray-300">
                    Sign up
                  </a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}