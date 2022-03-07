/* eslint-disable prefer-const */
import { Address, BigInt } from '@graphprotocol/graph-ts';
import { Deposit, Withdraw, NotifyReward, ClaimFees, ClaimRewards } from '../types/templates/Gauge/Gauge'
import { Bribe as BribeContract } from '../types/templates/Bribe/Bribe';
import { Bribe, BribeReward, Pair, Token } from '../types/schema'
import {
  fetchTokenSymbol,
  fetchTokenName,
  fetchTokenTotalSupply,
  fetchTokenDecimals,
  convertTokenToDecimal,
  ZERO_BD,
} from './helpers'

export function handleDeposit(event: Deposit): void {
}

export function handleWithdraw(event: Withdraw): void {
}

export function handleNotifyReward(event: NotifyReward): void {
  updateBribe(event.address, event.params.reward);
}

export function handleClaimRewards(event: ClaimRewards): void {
  updateBribe(event.address, event.params.reward);
}

function updateBribe(bribeAddress: Address, tokenAddress: Address): void {
  let key = bribeAddress.toHexString() + "-" +  tokenAddress.toHexString();
  let bribeReward = BribeReward.load(key)

  if (bribeReward == null) {
    bribeReward = new BribeReward(key)
    bribeReward.bribe = bribeAddress.toHexString();
    bribeReward.rewardAmount = ZERO_BD;
    bribeReward.rewardRate = ZERO_BD;
    bribeReward.token = tokenAddress.toHexString();
  }

  let token = Token.load(tokenAddress.toHexString());
  if (token === null) {
    token = new Token(tokenAddress.toHexString())
    token.symbol = fetchTokenSymbol(tokenAddress)
    token.name = fetchTokenName(tokenAddress)
    token.totalSupply = fetchTokenTotalSupply(tokenAddress)
    let decimals = fetchTokenDecimals(tokenAddress)

    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      return
    }

    token.decimals = decimals
    token.save();
  }

  let rewardAmountResult = BribeContract.bind(bribeAddress).try_rewardPerToken(tokenAddress);

  if (!rewardAmountResult.reverted) {
    bribeReward.rewardAmount = convertTokenToDecimal(rewardAmountResult.value, token.decimals);
  }

  let rewardRateResult = BribeContract.bind(bribeAddress).try_rewardRate(tokenAddress);

  if (!rewardRateResult.reverted) {
    bribeReward.rewardRate = convertTokenToDecimal(rewardRateResult.value, BigInt.fromI32(18));
  }

  bribeReward.save();

}
