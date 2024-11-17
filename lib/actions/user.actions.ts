'use server';

import { createSessionClient } from "../appwrite";

export const signIn = async ()=>{
    try{
        // we mostly do here MUTATIONS/ DATABASE/  MAKE FETCH 

        
    }catch(error){
        console.log("error", error)
    }
} 
export const signUp = async ()=>{
    try{
        // we mostly do here MUTATIONS/ DATABASE/  MAKE FETCH 
        // create a user account 

    }catch(error){
        console.log("error", error)
    }
} 

export async function getLoggedInUser() {
    try {
      const { account } = await createSessionClient();
      return await account.get();
  
  
    } catch (error) {
      console.log(error)
      return null;
    }
  }
  