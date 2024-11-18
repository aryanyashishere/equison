'use server';

import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { parseStringify } from "../utils";
import { cookies } from "next/headers";

export const signIn = async ({email, password}: signInProps)=>{
    try{
        // we mostly do here MUTATIONS/ DATABASE/  MAKE FETCH 
        // make a session to get the info for sign in function 
        // we need email and password only for sign in verification 

        const {account} = await createAdminClient();

        const response = await account.createEmailPasswordSession(email, password);
        return parseStringify(response);
        
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
  