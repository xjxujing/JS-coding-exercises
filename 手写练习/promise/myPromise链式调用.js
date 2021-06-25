
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
    onRejected = typeof onRejected === 'function' ? onRejected : res => { throw res }

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


  /**
   * 静态方法 resolve，可能接受的参数有：
   * 1.Promise 对象: 直接返回当前实例
   * 2.具有 then 方法的对象: 转为 Promise 对象，并立即执行 then 方法
   * 3.参数不是具有then()方法的对象，或根本就不是对象: 返回一个新的 Promise 对象，状态为 resolved
   * 4.不带有任何参数
   * 需要注意的是，立即resolve()的 Promise 对象，是在本轮“事件循环”（event loop）的结束时执行，而不是在下一轮“事件循环”的开始时。
  */
  static resolve(value) {
    if (value && value instanceof Promise) {
      return value
    } else if (value && typeof value === 'object' && typeof value.then === 'function') {
      return new Promise((resolve, reject) => {
        value.then(resolve, reject)
      })
    } else if (value) {
      return new Promise(resolve => resolve(value))
    } else {
      return new Promise(resolve => resolve())
    }
  }

  // 静态方法 reject 直接 rejected 状态的 Promise
  static reject(reason) {
    return new Promise((resolve, reject) => {
      reject(reason)
    })
  }

  /**
   * 状态都变成fulfilled，总的状态才会变成 fulfilled，返回值组成一个数组
   * 有一个被rejected，总的状态就变成 rejected，第一个被 reject 的实例的返回值，往下传
  */
  static all(promises) {
    const result = []
    const flagIndex = 0 // 计数的

    return new Promise((resolve, reject) => {
      for (let i = 0; i < promises.length; i++) {

        try {
          const p = promises[i]
          if (p && typeof p.then === 'function') {
            p.then(data => {
              result[i] = data
              flagIndex++
              if (flagIndex === promises.length) {
                resolve(result)
              }
            }, reject) // 有一个 rejected 了，直接 rejected
          } else { // 同步的
            result[i] = data
            flagIndex++
          }
        } catch (err) { // 有一个出错了也直接 rejected 状态
          reject(err)
        }
      }
    })
  }

  static race(promises) {
    return new Promise((resolve, reject) => {
      for (let i = 0; i < promises.length; i++) {
        promises[i].then(resolve, reject)
      }
    })
  }


  finally(callback) {
    let P = this.constructor
    return this.then(
      value => { P.resolve(callback()).then(() => value) },
      reason => { P.resolve(callback()).then(() => { throw reason }) }
    )
  }

  // catch 只是一个语法糖
  catch(errorFn) {
    this.then(null, errorFn)
  }
}