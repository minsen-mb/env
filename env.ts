/**
 * makecode env Package.
 */

enum env_BME280_I2C_ADDRESS {
  //% block="0x76"
  ADDR_0x76 = 0x76,
  //% block="0x77"
  ADDR_0x77 = 0x77
}

enum env_BME280_T {
  //% block="C"
  T_C = 0,
  //% block="F"
  T_F = 1
}

enum env_BME280_P {
  //% block="パスカル"
  Pa = 0,
  //% block="ヘクトパスカル"
  hPa = 1
}

/**
 * env block
 */
//% weight=100 color=#70c0f0 icon="\uf185" block="env"
namespace env {
  let BME280_I2C_ADDR = env_BME280_I2C_ADDRESS.ADDR_0x76

  function setreg(reg: number, dat: number): void {
    let buf = pins.createBuffer(2);
    buf[0] = reg;
    buf[1] = dat;
    pins.i2cWriteBuffer(BME280_I2C_ADDR, buf);
  }

  function getreg(reg: number): number {
    pins.i2cWriteNumber(BME280_I2C_ADDR, reg, NumberFormat.UInt8BE);
    return pins.i2cReadNumber(BME280_I2C_ADDR, NumberFormat.UInt8BE);
  }

  function getInt8LE(reg: number): number {
    pins.i2cWriteNumber(BME280_I2C_ADDR, reg, NumberFormat.UInt8BE);
    return pins.i2cReadNumber(BME280_I2C_ADDR, NumberFormat.Int8LE);
  }

  function getUInt16LE(reg: number): number {
    pins.i2cWriteNumber(BME280_I2C_ADDR, reg, NumberFormat.UInt8BE);
    return pins.i2cReadNumber(BME280_I2C_ADDR, NumberFormat.UInt16LE);
  }

  function getInt16LE(reg: number): number {
    pins.i2cWriteNumber(BME280_I2C_ADDR, reg, NumberFormat.UInt8BE);
    return pins.i2cReadNumber(BME280_I2C_ADDR, NumberFormat.Int16LE);
  }

  let dig_T1 = getUInt16LE(0x88)
  let dig_T2 = getInt16LE(0x8A)
  let dig_T3 = getInt16LE(0x8C)
  let dig_P1 = getUInt16LE(0x8E)
  let dig_P2 = getInt16LE(0x90)
  let dig_P3 = getInt16LE(0x92)
  let dig_P4 = getInt16LE(0x94)
  let dig_P5 = getInt16LE(0x96)
  let dig_P6 = getInt16LE(0x98)
  let dig_P7 = getInt16LE(0x9A)
  let dig_P8 = getInt16LE(0x9C)
  let dig_P9 = getInt16LE(0x9E)
  let dig_H1 = getreg(0xA1)
  let dig_H2 = getInt16LE(0xE1)
  let dig_H3 = getreg(0xE3)
  let a = getreg(0xE5)
  let dig_H4 = (getreg(0xE4) << 4) + (a % 16)
  let dig_H5 = (getreg(0xE6) << 4) + (a >> 4)
  let dig_H6 = getInt8LE(0xE7)
  setreg(0xF2, 0x04)
  setreg(0xF4, 0x2F)
  setreg(0xF5, 0x0C)
  let T = 0
  let P = 0
  let H = 0

  function get(): void {
    let adc_T = (getreg(0xFA) << 12) + (getreg(0xFB) << 4) + (getreg(0xFC) >> 4)
    let var1 = (((adc_T >> 3) - (dig_T1 << 1)) * dig_T2) >> 11
    let var2 = (((((adc_T >> 4) - dig_T1) * ((adc_T >> 4) - dig_T1)) >> 12) * dig_T3) >> 14
    let t = var1 + var2
    T = Math.idiv((t * 5 + 128) >> 8, 100)
    var1 = (t >> 1) - 64000
    var2 = (((var1 >> 2) * (var1 >> 2)) >> 11) * dig_P6
    var2 = var2 + ((var1 * dig_P5) << 1)
    var2 = (var2 >> 2) + (dig_P4 << 16)
    var1 = (((dig_P3 * ((var1 >> 2) * (var1 >> 2)) >> 13) >> 3) + (((dig_P2) * var1) >> 1)) >> 18
    var1 = ((32768 + var1) * dig_P1) >> 15
    if (var1 == 0)
      return; // avoid exception caused by division by zero
    let adc_P = (getreg(0xF7) << 12) + (getreg(0xF8) << 4) + (getreg(0xF9) >> 4)
    let _p = ((1048576 - adc_P) - (var2 >> 12)) * 3125
    _p = Math.idiv(_p, var1) * 2;
    var1 = (dig_P9 * (((_p >> 3) * (_p >> 3)) >> 13)) >> 12
    var2 = (((_p >> 2)) * dig_P8) >> 13
    P = _p + ((var1 + var2 + dig_P7) >> 4)
    let adc_H = (getreg(0xFD) << 8) + getreg(0xFE)
    var1 = t - 76800
    var2 = (((adc_H << 14) - (dig_H4 << 20) - (dig_H5 * var1)) + 16384) >> 15
    var1 = var2 * (((((((var1 * dig_H6) >> 10) * (((var1 * dig_H3) >> 11) + 32768)) >> 10) + 2097152) * dig_H2 + 8192) >> 14)
    var2 = var1 - (((((var1 >> 15) * (var1 >> 15)) >> 7) * dig_H1) >> 4)
    if (var2 < 0) var2 = 0
    if (var2 > 419430400) var2 = 419430400
    H = (var2 >> 12) >> 10
  }

  /**
   * get pressure
   */
  //% blockId="env_GET_PRESSURE" block="pressure %u"
  //% weight=60 blockGap=8
  //% block="気圧 %u"
  export function pressure(u: env_BME280_P): number {
    get();
    if (u == env_BME280_P.Pa) return P;
    else return Math.idiv(P, 100)
  }

  /**
   * get temperature
   */
  //% blockId="env_GET_TEMPERATURE" block="temperature %u"
  //% weight=60 blockGap=8
  //% block="温度 %u"
  export function temperature(): number {
    get();
    return T;
    // if (u == env_BME280_T.T_C) 
    // else return 32 + Math.idiv(T * 9, 5)
  }

  //% blockId="env_GET_HUMIDITY" block="humidity"
  //% weight=60 blockGap=8
  //% block="湿度"
  export function humidity(): number {
    get();
    return H;
  }

  /**
   * power on
   */
  //% blockId="env_POWER_ON" block="Power On"
  //% weight=71 blockGap=8
  //% block="気圧・温度・湿度センサー電源オン"
  export function PowerOn() {
    setreg(0xF4, 0x2F)
  }

  /**
   * power off
   */
  //% blockId="env_POWER_OFF" block="Power Off"
  //% weight=70 blockGap=8
  //% block="気圧・温度・湿度センサー電源オフ"
  export function PowerOff() {
    setreg(0xF4, 0)
  }

  //---------------------------------------------------------------
  
  let co2Value:number = -1
  let pos = 0
  const b = [0,0,0,0,0,0,0,0,0]

  //% blockId="env_CO2_START" block="Co2 Start"
  //% weight=32 blockGap=8
  //% block="二酸化炭素濃度センサー起動"
  export function Co2Init():void {
    basic.pause(1000 * 3)
    serial.redirect(SerialPin.P0, SerialPin.P1, 9600)
    basic.pause(1000 * 3)
    
    co2Value = -2

    control.inBackground(function(){
      while(true){
	const rb = serial.readBuffer(1)
	b[pos++] = rb[0]
	
	if(pos >= 9){

	  let checksum = 0;
	  for(let i = 1; i < 8; i++)
	    checksum += b[i];
	  checksum = 255 - (checksum % 256);
	  checksum += 1
	  
	  let judge = ((checksum % 256) == b[8]);
	  if(judge) co2Value = (b[2] * 256 + b[3])
	  else{
	    if(co2Value < 0) co2Value = co2Value - 1
	    else co2Value = -3
	  } 
	  pos = 0
	}
	basic.pause(5)
      }
    })
    control.inBackground(function(){
      while(true){
	//let now = input.runningTime()
	//if(now - idleAt > 5000){
	if(co2Value < -10){
	  serial.redirect(SerialPin.P0, SerialPin.P1, 9600)
	  co2Value = -2
	}
	basic.pause(250)
      }
    })
  }

  //% blockId="env_CO2_GET" block="Co2 Get"
  //% weight=30 blockGap=8
  //% block="二酸化炭素濃度"
  export function Co2Get():number {
    if(co2Value !== -1){
      pos = 0
      serial.writeBuffer(Buffer.fromArray([0xFF, 0x01, 0x86, 0x00, 0x00, 0x00, 0x00, 0x00, 0x79]))
    }
    basic.pause(1000)
    return co2Value
  }
}







