import React from 'react'
import TotalBalanceBox from '@/components/TotalBalanceBox';
import HeaderBox from '@/components/HeaderBox'
import RightSidebar from '@/components/RightSidebar';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { getAccount, getAccounts } from '@/lib/actions/bank.actions';
import RecentTrasactions from '@/components/RecentTrasactions';

const Home = async ({ searchParams: { id, page } }: SearchParamProps) => {
  
  const currentPage = Number(page as string) || 1;
  
  const loggedIn = await getLoggedInUser();
  console.log("from root page : logged in problem here ")
  const accounts = await getAccounts({ 
    userId: loggedIn.$id 
  })
  if(!accounts) return "maa chud gayi accounts nahin hai";
  
  const accountsData = accounts?.data;

  
  const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId;
  console.log("ye lo appwrite item id "+appwriteItemId)
  const account = await getAccount({ appwriteItemId })
  // if(!account  || ) console.log("account IS NOT HERE")
  console.log({
    accountsData,
    account
  })
  // console.log("account mein ye hai : " + {accounts})

  // console.log("total banks ki value " + {account?.totalBanks})
  // console.log("Transactions ki value " + {account?.transactions})

  return (
<section className="home">
    <div className="home-content">
      <header className="home-header">
        <HeaderBox 
          type="greeting"
          title="Welcome"
          user={loggedIn?.firstName|| 'Guest'}
          subtext="Access and manage your account and transactions efficiently."
        />

        <TotalBalanceBox 
          accounts={accountsData}
          // real banking data niche hai
          totalBanks={accounts?.totalBanks}
          totalCurrentBalance={accounts?.totalCurrentBalance}


          // fake banking data niche hai 
          // accounts={[]}
          // totalBanks={1}
          // totalCurrentBalance={110}
        />
      </header>
      {/* RECENT TRANSACTIONS */}
      <RecentTrasactions 
      accounts={accountsData}
      transactions={account?.transactions}
      appwriteItemId={appwriteItemId}
      page={currentPage}
      /> 
      </div>

      <RightSidebar
      user={loggedIn}
      transactions={account?.transactions}
      banks={accountsData?.slice(0, 2)} 
      />
      {/* transactions={[]}
      banks={[{currentBalance: 123.59},{currentBalance:555.58}]} /> */}
</section> 
 )
}

export default Home