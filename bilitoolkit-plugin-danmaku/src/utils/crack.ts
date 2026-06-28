class Crc32UidCracker {
  private static readonly POLY = 0xedb88320

  private crcTable: Uint32Array = new Uint32Array(256)
  private rainbowBase: Uint32Array = new Uint32Array(100000)
  private rainbowShifted: Uint32Array = new Uint32Array(100000)

  // 桶排序哈希表，用于 O(1) 复杂度的快速查找
  private bucketPointers: Uint32Array = new Uint32Array(65537)
  private hashTable: Uint32Array = new Uint32Array(200000)

  constructor() {
    this.initCrcTable()
    this.buildRainbowTables()
    this.buildHashTable()
  }

  /**
   * 初始化 CRC32 查表
   */
  private initCrcTable(): void {
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let j = 0; j < 8; j++) {
        c = c & 1 ? (c >>> 1) ^ Crc32UidCracker.POLY : c >>> 1
      }
      this.crcTable[i] = c >>> 0
    }
  }

  /**
   * 单步更新 CRC
   */
  private stepCrc(byte: number, crc: number): number {
    return ((crc >>> 8) ^ this.crcTable[(crc ^ byte) & 0xff]) >>> 0
  }

  /**
   * 计算数组的 CRC 值
   */
  private computeSequence(seq: number[], startCrc: number = 0): number {
    let crc = startCrc
    for (let i = 0; i < seq.length; i++) {
      crc = this.stepCrc(seq[i], crc)
    }
    return crc
  }

  /**
   * 预计算彩虹表
   */
  private buildRainbowTables(): void {
    const zeros = [0, 0, 0, 0, 0]
    for (let i = 0; i < 100000; i++) {
      const digits = Array.from(String(i), Number)
      const crcBase = this.computeSequence(digits, 0)

      this.rainbowBase[i] = crcBase
      this.rainbowShifted[i] = this.computeSequence(zeros, crcBase)
    }
  }

  /**
   * 构建哈希映射表
   */
  private buildHashTable(): void {
    // 1. 统计前 16 位的频率
    for (let i = 0; i < 100000; i++) {
      this.bucketPointers[this.rainbowBase[i] >>> 16]++
    }

    // 2. 计算前缀和，确定每个桶的起始位置
    for (let i = 1; i <= 65536; i++) {
      this.bucketPointers[i] += this.bucketPointers[i - 1]
    }

    // 3. 填充哈希表
    for (let i = 0; i < 100000; i++) {
      const high16 = this.rainbowBase[i] >>> 16
      this.bucketPointers[high16]--
      const pos = this.bucketPointers[high16]

      this.hashTable[pos * 2] = this.rainbowBase[i]
      this.hashTable[pos * 2 + 1] = i
    }
  }

  /**
   * 在哈希表中查找匹配的 CRC
   */
  private findInHash(targetCrc: number): number[] {
    const matches: number[] = []
    const high16 = targetCrc >>> 16
    const start = this.bucketPointers[high16]
    const end = this.bucketPointers[high16 + 1]

    for (let i = start; i < end; i++) {
      if (this.hashTable[i * 2] === targetCrc) {
        matches.push(this.hashTable[i * 2 + 1])
      }
    }
    return matches
  }

  /**
   * 核心破解算法
   */
  public crack(targetHash: number, maxDigits: number): number[] {
    const results: number[] = []
    const invertedTarget = ~targetHash >>> 0
    let runningBase = 0xffffffff

    for (let digits = 1; digits <= maxDigits; digits++) {
      // ASCII 的 '0' 是 0x30
      runningBase = this.stepCrc(0x30, runningBase)

      if (digits < 6) {
        const startUid = Math.pow(10, digits - 1)
        const endUid = Math.pow(10, digits)

        for (let uid = startUid; uid < endUid; uid++) {
          const testHash = (runningBase ^ this.rainbowBase[uid]) >>> 0
          if (invertedTarget === testHash) {
            results.push(uid)
          }
        }
      } else {
        const startPrefix = Math.pow(10, digits - 6)
        const endPrefix = Math.pow(10, digits - 5)

        for (let prefix = startPrefix; prefix < endPrefix; prefix++) {
          const remainder = (invertedTarget ^ runningBase ^ this.rainbowShifted[prefix]) >>> 0
          const suffixes = this.findInHash(remainder)

          for (const suffix of suffixes) {
            results.push(prefix * 100000 + suffix)
          }
        }
      }
    }

    return results
  }
}

// 维持单例模式，避免重复计算耗时的彩虹表
let sharedCrackerInstance: Crc32UidCracker | null = null

export function crackUidHash(uidHash: string, maxDigit: number = 10): number[] {
  if (!sharedCrackerInstance) {
    sharedCrackerInstance = new Crc32UidCracker()
  }
  const parsedHash = parseInt(uidHash, 16)
  return sharedCrackerInstance.crack(parsedHash, maxDigit)
}
