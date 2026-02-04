export default function AuthCodeError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <h1 className="text-3xl font-bold text-red-500 mb-4">Authentication Error</h1>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        We encountered an error while signing you in. This might be due to an expired link or a configuration issue.
      </p>
      <a 
        href="/"
        className="px-6 py-2 bg-casino-brand text-black font-bold rounded-lg hover:bg-casino-brand/90 transition-colors"
      >
        Return to Home
      </a>
    </div>
  )
}
