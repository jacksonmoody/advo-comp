import Image from 'next/image'

const Onboarding = ({ setOnboarded }: { setOnboarded: (state: boolean) => void }) => {
  return (
    <div className="bg-scale-200 h-screen w-screen flex flex-col items-center justify-center space-y-4 bg-white">
      <Image src="/logo.svg" alt="Advocate Logo" width="100" height="100" />
      <h1 className="text-2xl text-center">Advocate Collaborative Poetry Board</h1>
      <p className="text-center">By Jackson Moody, 2024 Fall Comp</p>
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
