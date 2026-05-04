import { AlertTriangle } from "lucide-react";

const AlertBar = () => {
    return (

        <div className='flex shrink-0 items-center justify-center relative py-1 bg-[#438FEF] text-[11px] text-white h-7 w-full z-50 gap-2 tracking-wider'>
            <AlertTriangle className="w-5 h-5" />
            <p className="text-white">Heads Up! Your trial ends in
                <span className="font-bold p-[2px] rounded-[4px] bg-orange-400 mx-2"> 7 </span>
                Days</p>
            <span className='text-gray-600 text-2xl'> | </span>
            <p>
                <button
                    onClick={() => navigate('/get-plan?isUpgrade=true')}
                    className='font-extrabold underline cursor-pointer'>
                    Upgrade Now</button> to keep your account active!</p>
        </div>
    );
}

export default AlertBar;
