const Loader = () => {
  return (
    <div className="bg-scale-200 h-screen w-screen flex flex-col items-center justify-center space-y-4 bg-white">
      <span className="flex h-8 w-8 relative">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75" />
        <span className="relative inline-flex rounded-full h-full w-full bg-black" />
      </span>
      <p className="text-xl">Loading...</p>
    </div>
  )
}

export default Loader
