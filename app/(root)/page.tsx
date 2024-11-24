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
  
  const accounts = await getAccounts({ 
    userId: loggedIn.$id 
  })
  if(!accounts) return;
  
  const accountsData = accounts?.data;
  const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId;
  
  const account = await getAccount({ appwriteItemId })
  console.log({
    accountsData,
    account
  })
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
          // totalBanks={account?.totalBanks}
          // totalCurrentBalance={accounts?.totalCurrentBalance}


          // fake banking data niche hai 
          // accounts={[]}
          totalBanks={1}
          totalCurrentBalance={110}
        />
      </header>
      {/* RECENT TRANSACTIONS */}
      <RecentTrasactions 
      accounts={accountsData}
      transactions={account?.transactions}
      appwriteItemId={appwriteItemId}
      page={currentPage}/> 
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