import { LoginForm } from '@/AUTH/login-form'

const Signin = () => {
  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}

export default Signin