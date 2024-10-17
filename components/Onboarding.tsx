const Onboarding = ({ setOnboarded }: { setOnboarded: (state: boolean) => void }) => {
  return (
    <div className="bg-scale-200 h-screen w-screen flex flex-col items-center justify-center space-y-4 bg-white">
      <h1 className="text-2xl">Advocate Collaborative Poetry Board</h1>
      <p>By Jackson Moody, 2024 Fall Advocate Comp</p>
      <button
        className="bg-black text-white px-5 py-2 rounded-md text-xl"
        onClick={() => {
          localStorage.setItem('onboarded', 'true')
          setOnboarded(true)
        }}
      >
        Get Started
      </button>
    </div>
  )
}

export default Onboarding
