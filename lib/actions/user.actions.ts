'use server';

import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { encryptId, extractCustomerIdFromUrl, parseStringify } from "../utils";
import { cookies } from "next/headers";
import { plaidClient } from "../plaid";
import { CountryCode, ProcessorTokenCreateRequest, ProcessorTokenCreateRequestProcessorEnum, Products } from "plaid";
import { revalidatePath } from "next/cache";
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions";


const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
  APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID,
} = process.env;

export const getUserInfo = async ({ userId }: getUserInfoProps) => {
  try {
    const { database } = await createAdminClient();

    const user = await database.listDocuments(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      [Query.equal('userId', [userId])]
    )
// console.log("getuserinfo func ka mamla hai : ")
    // console.log( parseStringify(user.documents[0]));
    return parseStringify(user.documents[0]);
  } catch (error) {
    console.log(error)
  }
}

export const signIn = async ({email, password}: signInProps)=>{
    try{
        // we mostly do here MUTATIONS/ DATABASE/  MAKE FETCH 
        // make a session to get the info for sign in function 
        // we need email and password only for sign in verification 

        const {account} = await createAdminClient();
        const session = await account.createEmailPasswordSession(email, password);

        cookies().set("appwrite-session", session.secret, {
          path: "/",
          httpOnly: true,
          sameSite: "strict",
          secure: true,
        });
        const user = await getUserInfo({ userId: session.userId }) 

        return parseStringify(user);


        // const response = await account.createEmailPasswordSession(email, password);
        // return parseStringify(response);
        
    }catch(error){
        console.log("error", error)
    }
} 
export const signUp = async ({password, ...userData}: SignUpParams)=>{
    const { email, firstName, lastName } = userData;
    let newUserAccount;

    try{
        // we mostly do here MUTATIONS/ DATABASE/  MAKE FETCH 
// create a user account 
 
        const {account, database} = await createAdminClient();

        newUserAccount = await account.create(
          ID.unique(), 
          email, 
          password, 
          `${firstName} ${lastName}`
        );

        if(!newUserAccount) throw new Error('Error creating user')

          const dwollaCustomerUrl = await createDwollaCustomer({
            ...userData,
            type: 'personal'
          })

          if(!dwollaCustomerUrl) throw new Error('Error creating Dwolla customer')

            const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl);

            const newUser = await database.createDocument(
              DATABASE_ID!,
              USER_COLLECTION_ID!,
              ID.unique(),
              {
                ...userData,
                userId: newUserAccount.$id,
                dwollaCustomerId,
                dwollaCustomerUrl
              }
            )


        const session = await account.createEmailPasswordSession(email, password);
    cookies().set("appwrite-session", session.secret, {
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });
    // console.log("it is using cookies.set from signup ")

    return parseStringify(newUser);


    }
    catch(error){
        console.log("error", error)
        // console.log("it is using cookies.set from signup ERROR")

    }
} 

export async function getLoggedInUser() {
    try {
      // const { account } = await createSessionClient();
      // return await account.get();

      // (======== after connection with plaid ===========)
      const { account } = await createSessionClient();
      const result = await account.get();
      // console.log("result  ki value in getloggedin tsx pg 132")
      // console.log(parseStringify(result))
  
      const user = await getUserInfo({ userId: result.$id})
      // console.log(parseStringify(user))
      return parseStringify(user);

  
  
    } catch (error) {
      console.log(error)
      // console.log("getloggedinuser mein prblm ")
      return null;
    }
  }
  

export const logoutAccount = async () => {
  try{
    const { account } = await createSessionClient();
    cookies().delete('appwrite-session');
    await account.deleteSession('current');
    // console.log("logout ho gaya acche se pg 152")

  }catch(error){
    // console.log("logout na hora pg 154")
    return null;
  }
}

export const createLinkToken = async (user: User) => {
  try {
    const tokenParams = {
      user: {
        client_user_id: user.$id
      },
      client_name: `${user.firstName} ${user.lastName}`,
      products: ['auth', 'transactions'] as Products[],
      language: 'en',
      country_codes: ['US'] as CountryCode[],
    }

    const response = await plaidClient.linkTokenCreate(tokenParams);
    // console.log("createlinktoken mein response data link token aur link token yahan return karega : ")
    if (!response.data.link_token) {
      console.log("Link token is missing!");
  }

  const linkTokenData = { linkToken: response.data.link_token };
// console.log("Returning object:", linkTokenData);
return parseStringify(linkTokenData);

    // return parseStringify({ linkToken: response.data.link_token })
  } catch (error) {
    console.log(error);
  }
}

export const exchangePublicToken = async ({
  publicToken,
  user,
}: exchangePublicTokenProps) => {
  try {
    // Exchange public token for access token and item ID
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;
    
    // Get account information from Plaid using the access token
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accountData = accountsResponse.data.accounts[0];

    // Create a processor token for Dwolla using the access token and account ID
    const request: ProcessorTokenCreateRequest = {
      access_token: accessToken,
      account_id: accountData.account_id,
      processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum,
    };

    const processorTokenResponse = await plaidClient.processorTokenCreate(request);
    const processorToken = processorTokenResponse.data.processor_token;

     // Create a funding source URL for the account using the Dwolla customer ID, processor token, and bank name
     const fundingSourceUrl = await addFundingSource({
      dwollaCustomerId: user.dwollaCustomerId,
      processorToken,
      bankName: accountData.name,
    });
    
    // If the funding source URL is not created, throw an error
    if (!fundingSourceUrl) throw Error("funding source nahin mila  pg 248");

    // Create a bank account using the user ID, item ID, account ID, access token, funding source URL,
    //  and shareableId ID
    await createBankAccount({
      userId: user.$id,
      bankId: itemId,
      accountId: accountData.account_id,
      accessToken,
      fundingSourceUrl,
      shareableId: encryptId(accountData.account_id),
    });
// console.log("at exchange public token 259 bank account ban gaya")
    // Revalidate the path to reflect the changes
    revalidatePath("/");

    // Return a success message
    return parseStringify({
      publicTokenExchange: "complete",
    });
  } catch (error) {
    console.error("An error occurred while creating exchanging token:", error);
  }
}

export const createBankAccount = async ({
  userId,
  bankId,
  accountId,
  accessToken,
  fundingSourceUrl,
  shareableId,
}: createBankAccountProps) => {
  try {
    const { database } = await createAdminClient();

    const bankAccount = await database.createDocument(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        bankId,
        accountId,
        accessToken,
        fundingSourceUrl,
        shareableId,
      }
    )

    // console.log("bankAccount ki info from createadminclient : pg 274 ", bankAccount);
    // return parseStringify(bankAccount);
    if (!bankAccount) {
      console.error("bankAccount is undefined or null!");
    }
    
    const parsedBankAccount = parseStringify(bankAccount);
// console.log("Parsed bankAccount object:", parsedBankAccount);
return parsedBankAccount;

  } catch (error) {
    // console.log("bankAccount ki info from createadminclient :  NAHIN MILI ")
    console.log(error);
  }
}



export const getBanks = async ({ userId }: getBanksProps) => {
  try {
    const { database } = await createAdminClient();

    const banks = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal('userId', [userId])]
    )
    // console.log("bank mil gaya : getbanks : hehe ")
    // console.log(parseStringify(banks.documents))
    return parseStringify(banks.documents);
  } catch (error) {
    console.log("bank nahin mila getBanks : haha : ")
    console.log(error)
  }
}

export const getBank = async ({ documentId }: getBankProps) => {
  try {
    const { database } = await createAdminClient();

    const bank = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal('$id', [documentId])]
    )
    // console.log("bank mil gaya : getbank : hehe ")
    // console.log(parseStringify(bank.documents[0]))
    return parseStringify(bank.documents[0]);
  } catch (error) {
    console.log("bank nahin mila getBank : haha : ")

    console.log(error)
  }
}

export const getBankByAccountId = async ({ accountId }: getBankByAccountIdProps) => {
  try {
    const { database } = await createAdminClient();

    const bank = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal('accountId', [accountId])]
    )

    if(bank.total !== 1) return null;

    return parseStringify(bank.documents[0]);
  } catch (error) {
    console.log(error)
  }
}