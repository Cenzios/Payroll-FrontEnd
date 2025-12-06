const AuthSidePanel = () => {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-[#5B8EF5] relative overflow-hidden">
      <div className="absolute top-20 right-20 w-60 h-60 border-[30px] border-white/15 rounded-full translate-x-32 -translate-y-32"></div>

      <div className="absolute top-55 -left-20 w-64 h-64 border-[30px] border-white/15 rounded-full"></div>
      <div className="absolute top-1/2 -left-28 w-80 h-80 border-[20px] border-white/10 rounded-full"></div>

      <div className="absolute bottom-[-20px] -left-28 w-40 h-40 bg-white/15 rounded-full translate-x-80 transition-all duration-300 ease-in-out"></div>

      <div className="absolute bottom-10 right-16 grid grid-cols-10 gap-3 opacity-20">
        {[...Array(100)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 bg-white rounded-full"></div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col justify-center px-16 text-white">
        <div className="flex items-center gap-3 mb-16">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="8" fill="#5B8EF5" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Payrole</h1>
        </div>

        <h2 className="text-4xl font-semibold mb-4 leading-tight">
          Automated. Accurate. On Time.
        </h2>
        <p className="text-2xl text-white/100 font-light">
          Welcome to Payrole.
        </p>
      </div>
    </div>
  );
};

export default AuthSidePanel;
