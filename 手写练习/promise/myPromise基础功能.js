
const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

class Promise {
  constructor(executor) {
    this.status = PENDING
    this.success = undefined
    this.reason = undefined

    this.onFulfilledCallbacks = []
    this.onRejectedCallbacks = []


    const resolve = (success) => {
      if (this.status === PENDING) {
        this.status = FULFILLED
        this.success = success
        this.onFulfilledCallbacks.forEach(fn => fn())
      }
    }

    const reject = (reason) => {
      if (this.status === PENDING) {
        this.status = REJECTED
        this.reason = reason
        this.onRejectedCallbacks.forEach(fn => fn())
      }
    }

    try {
      executor(resolve, reject)
    } catch (e) {
      reject(e)
    }
  }

  then(onFulfilled, onRejected) {

    // Promise 传的操作没有异步的时候 直接执行
    if (this.status === FULFILLED) {
      onFulfilled(this.success)
    }
    if (this.status === REJECTED) {
      onRejected(this.reason)
    }

    if(this.status === PENDING) {
      this.onFulfilledCallbacks.push(() => {
        onFulfilled(this.success)
      })
      this.onRejectedCallbacks.push(() => {
        onRejected(this.reason)
      })
    }
  }
}