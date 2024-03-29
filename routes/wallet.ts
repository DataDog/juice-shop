/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { Request, Response, NextFunction } from 'express'
import { WalletModel } from '../models/wallet'
import { CardModel } from '../models/card'
const tracer = require('dd-trace')

module.exports.getWalletBalance = function getWalletBalance () {
  return async (req: Request, res: Response, next: NextFunction) => {
    const wallet = await WalletModel.findOne({ where: { UserId: req.body.UserId } })
    if (wallet) {
      res.status(200).json({ status: 'success', data: wallet.balance })
    } else {
      res.status(404).json({ status: 'error' })
    }
  }
}

module.exports.addWalletBalance = function addWalletBalance () {
  return async (req: Request, res: Response, next: NextFunction) => {
    tracer.appsec.trackCustomEvent('activity.sensitive', { name: 'add_wallet_balance' })
    const cardId = req.body.paymentId
    const card = cardId ? await CardModel.findOne({ where: { id: cardId, UserId: req.body.UserId } }) : null
    if (card) {
      WalletModel.increment({ balance: req.body.balance }, { where: { UserId: req.body.UserId } }).then(() => {
        tracer.appsec.trackCustomEvent('payment.attempt', { status: 'success' })
        res.status(200).json({ status: 'success', data: req.body.balance })
      }).catch(() => {
        res.status(404).json({ status: 'error' })
      })
    } else {
      tracer.appsec.trackCustomEvent('payment.attempt', { status: 'failed' })
      res.status(402).json({ status: 'error', message: 'Payment not accepted.' })
    }
  }
}
