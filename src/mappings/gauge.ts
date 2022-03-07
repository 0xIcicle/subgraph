/* eslint-disable prefer-const */
import { Address, BigInt } from '@graphprotocol/graph-ts';
import { Deposit, Withdraw, NotifyReward, ClaimFees, ClaimRewards } from '../types/templates/Gauge/Gauge'
import { Gauge, Pair, Token } from '../types/schema'
import {
  bigDecimalExp18,
  createUser, 
  createGaugePosition,
  convertTokenToDecimal,
  routerContract,
} from './helpers'

export function handleDeposit(event: Deposit): void {
  let gauge = Gauge.load(event.address.toHexString())
  let decimalAmount = convertTokenToDecimal(event.params.amount, BigInt.fromI32(18));
  gauge.totalSupply = gauge.totalSupply.plus(decimalAmount);
  updateReserves(gauge);


  createUser(event.params.from);
  let gaugePosition = createGaugePosition(event.address, event.params.from);
  gaugePosition.gaugeBalance = gaugePosition.gaugeBalance.plus(decimalAmount);

  gauge.save();
  gaugePosition.save();
}

export function handleWithdraw(event: Withdraw): void {
  let gauge = Gauge.load(event.address.toHexString())
  let decimalAmount = convertTokenToDecimal(event.params.amount, BigInt.fromI32(18));
  gauge.totalSupply = gauge.totalSupply.minus(decimalAmount);
  updateReserves(gauge);

  createUser(event.params.from);
  let gaugePosition = createGaugePosition(event.address, event.params.from);
  gaugePosition.gaugeBalance = gaugePosition.gaugeBalance.minus(decimalAmount);

  gauge.save();
  gaugePosition.save();
}

export function handleNotifyReward(event: NotifyReward): void {
  let gauge = Gauge.load(event.address.toHexString())
  updateReserves(gauge);
  gauge.save();
}

export function handleClaimFees(event: ClaimFees): void {
  let gauge = Gauge.load(event.address.toHexString())
  updateReserves(gauge);
  gauge.save();
}

export function handleClaimRewards(event: ClaimRewards): void {
  let gauge = Gauge.load(event.address.toHexString())
  updateReserves(gauge);
  gauge.save();
}

function updateReserves(gauge: Gauge | null): void {
  let pair = Pair.load(gauge.pair)
  let token0 = Token.load(pair.token0)
  let token1 = Token.load(pair.token1)
  if (!gauge || !pair || !token0 || !token1) {
    return;
  }

  let totalSupply = BigInt.fromString(gauge.totalSupply.times(bigDecimalExp18()).toString());
  let reservesResult = routerContract.try_quoteRemoveLiquidity(Address.fromHexString(pair.token0) as Address, Address.fromHexString(pair.token1) as Address, pair.stable, totalSupply)

  if (!reservesResult.reverted) {
    gauge.reserve0 = convertTokenToDecimal(reservesResult.value.value0, token0.decimals)
    gauge.reserve1 = convertTokenToDecimal(reservesResult.value.value1, token1.decimals)
  }
}
