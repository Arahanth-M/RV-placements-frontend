import axios from "axios";
import { useEffect, useState } from "react";
import { BASE_URL } from "../utils/constants";

const Premium = () => {
  const [isUserPremium,setUserPremium] = useState(false);
  useEffect(() => {
    verifyPremiumUser()
  },[]);

  const verifyPremiumUser =async () => {
    const res = await axios.get(BASE_URL+"/premium/verify" , {
      withCredentials: true,
    })
    if (res.data.isPremium == true){
      setUserPremium(true);
    }
  }
  const handleBuyClick = async (type) => {
    const order = await axios.post(BASE_URL+"/payment/create",{
      membershipType: type,
      
    },
    {withCredentials: true}
  );
  const {amount, keyId,currency,notes,orderId} = order.data

  //after calling the createOrder api from the button click , the baceknd will send the order request to RP and get orderId from it
  //the orderId will be sent back to the frontend

  //after that the dilog box should open

  const options = {
    key: keyId, 
    amount,
    currency,
    name: 'Last Minute Placement Prep',
    description: 'Ultimate placement prep company data',
    order_id: orderId, 
    
    prefill: {
      name: notes.firstName+' '+notes.lastName,
      email: notes.emailId,
      contact: '9999999999'
    },
    theme: {
      color: '#F37254'
    },
    handler: verifyPremiumUser, 
  };
  const rzp = new window.RazorPay(options);
  rzp.open();//this will open up the payment page
  }
    return isUserPremium?(
      "You are a premium user"
    ):(
      <div className="flex w-full items-center justify-center space-x-4">
        {/* Left Card */}
        <div className="rounded-lg bg-gray-200 h-80 w-full flex-grow items-center justify-center">
          <h1>Silver Membership</h1>
          <li>
            <ol>feature 1</ol>
            <ol>feature 2</ol>
          </li>
          <button onClick = {() => handleBuyClick("silver")} className = "bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600">Buy Silver</button>
        </div>
  
        {/* Divider with text */}
        <div className="flex items-center">
          <div className="h-full border-l border-gray-300"></div>
          <span className="px-3 text-gray-500 text-sm">OR</span>
          <div className="h-full border-l border-gray-300"></div>
        </div>
  
        {/* Right Card */}
        <div className="rounded-lg bg-gray-200 h-80 w-full flex-grow items-center justify-center">
          <h1>Gold Premium Membership</h1>
          <li>
          <ol>feature 1</ol>
          <ol>feature 2</ol>
          </li>
          <button onClick = {() => handleBuyClick("gold")} className = "bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600">Buy Gold</button>
        </div>
      </div>
    );
  };
  
  export default Premium;
  