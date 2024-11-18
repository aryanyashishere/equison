'use server';

import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { parseStringify } from "../utils";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export const signIn = async ()=>{
    try{
        // we mostly do here MUTATIONS/ DATABASE/  MAKE FETCH 

        
    }catch(error){
        console.log("error", error)
    }
} 
export const signUp = async (userData: SignUpParams)=>{
    const { email,password, firstName, lastName } = userData;


    try{
        // we mostly do here MUTATIONS/ DATABASE/  MAKE FETCH 
// create a user account 
        // let newUserAccount;
 
        const {account} = await createAdminClient();



       const newUserAccount = await account.create(
          ID.unique(), 
          email, 
          password, 
          `${firstName} ${lastName}`
        );

        const session = await account.createEmailPasswordSession(email, password);

    cookies().set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });
    
    return parseStringify(newUserAccount);


    }
    catch(error){
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
  