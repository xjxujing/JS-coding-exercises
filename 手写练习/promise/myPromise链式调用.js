
const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'


function resolvePromise(x, promise2, resolve, reject) {

  if (x === promise2) {
    return reject(new TypeError('循环引用'))
  }

  // 如果 x 是个具有 then 方法的 对象（可以理解为判断 promise）
  if (typeof x === 'object' && x !== null) {

    let then = x.then
    if (typeof then === 'function') {
      then.call(x, (y) => {
        resolve(y)
        // resolvePromise(y, promise2, resolve, reject)
      }, r => reject(r))
    } else { // x 是个普通对象
      resolve(x)
    }
  } else { // x 是原始数据类型
    resolve(x)
  }
}


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
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v
    onRejected = typeof onRejected === 'function' ? onRejected : res => {throw res}

    let promise2 = new Promise((resolve, reject) => {
      if (this.status === FULFILLED) {
        setTimeout(() => {
          try {
            let x = onFulfilled(this.success)
            resolvePromise(x, promise2, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }
      if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            let x = onRejected(this.reason)
            resolvePromise(x, promise2, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }

      if (this.status === PENDING) {
        this.onFulfilledCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onFulfilled(this.success)
              resolvePromise(x, promise2, resolve, reject)
            } catch (e) {
              reject(e)
            }
          })
        })
        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onRejected(this.reason)
              resolvePromise(x, promise2, resolve, reject)
            } catch (e) {
              reject(e)
            }
          })

        })
      }
    })

    return promise2
  }


}