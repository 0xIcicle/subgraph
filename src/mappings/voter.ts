/* eslint-disable prefer-const */
import { Gauge, Bribe } from '../types/schema'
import { Gauge as GaugeTemplate, Bribe as BribeTemplate } from '../types/templates'
import { GaugeCreated } from '../types/Voter/Voter';
import {
  ZERO_BD,
} from './helpers'

export function handleGaugeCreated(event: GaugeCreated): void {
  let gaugeAddress = event.params.gauge.toHexString();
  let gauge = Gauge.load(gaugeAddress)
  if (gauge === null) {
    gauge = new Gauge(gaugeAddress)

    // NOTE: this assumes only one gauge per block
    // to handle more we can iterate through hash(gaugeFactory || nonce)
    gauge.pair = event.params.pool.toHexString();
    gauge.bribe = event.params.bribe.toHexString();
    gauge.totalSupply = ZERO_BD;
    gauge.reserve0 = ZERO_BD;
    gauge.reserve1 = ZERO_BD;
    gauge.save()
    GaugeTemplate.create(event.params.gauge)
  }

  let bribeAddress = event.params.bribe.toHexString();
  let bribe = Bribe.load(bribeAddress)
  if (bribe === null) {
    bribe = new Bribe(bribeAddress)

    // NOTE: this assumes only one gauge per block
    // to handle more we can iterate through hash(gaugeFactory || nonce)
    bribe.pair = event.params.pool.toHexString();
    bribe.gauge = event.params.gauge.toHexString();

    bribe.save()
    BribeTemplate.create(event.params.bribe)
  }
}
