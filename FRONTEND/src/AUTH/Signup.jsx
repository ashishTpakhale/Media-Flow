import { SignupForm } from "@/AUTH/signup-form"

const Signup = () => {
  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Subtle Background Grid/Pattern for depth */}
      <div className="absolute inset-0 z-0 opacity-[0.05]" 
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      <div className="w-full max-w-[440px] z-10">
        {/* Minimal Header */}
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Create Account
          </h1>
          <p className="text-gray-400 text-base">
            Enter your details to get started.
          </p>
        </div>

        <SignupForm />
        
        {/* Minimal Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-600">
            Protected by reCAPTCHA and subject to the <br/>
            <a href="/privacy" className="underline text-gray-400 hover:text-white transition-colors">Privacy Policy</a> and <a href="/terms" className="underline text-gray-400 hover:text-white transition-colors">Terms of Service</a>.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Signup