// -----------------------------------------------------------------------------
// MHZ19 CO2 sensor
// Based on: https://github.com/nara256/mhz19_uart
// http://www.winsen-sensor.com/d/files/infrared-gas-sensor/mh-z19b-co2-ver1_0.pdf
// Copyright (C) 2017-2019 by Xose Pérez <xose dot perez at gmail dot com>
// -----------------------------------------------------------------------------

#if SENSOR_SUPPORT && MHZ19_SUPPORT

#pragma once

#include "BaseSensor.h"
#include <SoftwareSerial.h>
#include <array>

#define MHZ19_DATA_LEN 9
#define MHZ19_TIMEOUT 1000
#define MHZ19_GETPPM 0x8600
#define MHZ19_ZEROCALIB 0x8700
#define MHZ19_SPANCALIB 0x8800
#define MHZ19_AUTOCALIB_ON 0x79A0
#define MHZ19_AUTOCALIB_OFF 0x7900

class MHZ19Sensor : public BaseSensor
{

private:
    using Data = std::array<uint8_t, MHZ19_DATA_LEN>;
    struct ResponseData
    {
        bool status{false};
        Data data{};
    };

    static uint8_t _checksum(const Data &data)
    {
        uint8_t sum = 0x00;
        for (size_t i = 1; i < (data.size() - 1); ++i)
        {
            sum += data[i];
        }
        sum = 0xFF - sum + 0x01;
        return sum;
    }

public:
    void setPort(Stream *port)
    {
        _serial = new SoftwareSerial(UART2_RX_PIN, UART2_TX_PIN, false);
        _serial->begin(UART2_BAUDRATE);
        // _serial = port;
        _dirty = true;
    }

    // ---------------------------------------------------------------------
    // Sensor API
    // ---------------------------------------------------------------------

    unsigned char id() const override
    {
        return SENSOR_MHZ19_ID;
    }

    unsigned char count() const override
    {
        return 1;
    }

    // Initialization method, must be idempotent
    void begin() override
    {
        if (!_dirty)
            return;

        calibrateAuto(_calibrateAuto);

        _ready = true;
        _dirty = false;
    }

    // Descriptive name of the sensor
    String description() const override
    {
        return F("MHZ19");
    }

    // Address of the sensor (it could be the GPIO or I2C address)
    String address(unsigned char) const override
    {
        return String(MHZ19_PORT, 10);
    }

    // Type for slot # index
    unsigned char type(unsigned char index) const override
    {
        if (index == 0)
            return MAGNITUDE_CO2;
        return MAGNITUDE_NONE;
    }

    void pre() override
    {
        _read();
    }

    // Current value for slot # index
    double value(unsigned char index) override
    {
        if (index == 0)
            return _co2;
        return 0;
    }

    void calibrateAuto(bool state)
    {
        _write(state ? MHZ19_AUTOCALIB_ON : MHZ19_AUTOCALIB_OFF);
    }

    void calibrateZero()
    {
        _write(MHZ19_ZEROCALIB);
    }

    void calibrateSpan(unsigned int ppm)
    {
        if (ppm < 1000)
            return;
        Data data{};
        data[0] = 0xFF;
        data[1] = 0x01;
        data[2] = MHZ19_SPANCALIB >> 8;
        data[3] = ppm >> 8;
        data[4] = ppm & 0xFF;
        _write(data);
    }

    void setCalibrateAuto(bool value)
    {
        _calibrateAuto = value;
        if (_ready)
        {
            calibrateAuto(value);
        }
    }

protected:
    // ---------------------------------------------------------------------
    // Protected
    // ---------------------------------------------------------------------

    void _write(const Data &data)
    {
        _serial->write(data.data(), data.size() - 1);
        _serial->write(_checksum(data));
        _serial->flush();
    }

    void _write(unsigned int command)
    {
        Data data{0};
        data[0] = 0xFF;
        data[1] = 0x01;
        data[2] = command >> 8;
        data[3] = command & 0xFF;
        _write(data);
    }

    ResponseData _request(unsigned int command)
    {
        _write(command);

        using TimeSource = espurna::time::CoreClock;
        static constexpr auto Timeout = espurna::duration::Milliseconds{MHZ19_TIMEOUT};

        ResponseData response{};

        const auto start = TimeSource::now();
        while (_serial->available() == 0)
        {
            if (TimeSource::now() - start > Timeout)
            {
                _error = SENSOR_ERROR_TIMEOUT;
                return response;
            }
            delay(10);
        }

        _serial->readBytes(response.data.data(), response.data.size());
        return response;
    }

    void _read()
    {

        auto ppm = _request(MHZ19_GETPPM);
        // if (!ppm.status) {
        //     return;
        // }

        // Check response
        if ((ppm.data[0] == 0xFF) && (ppm.data[1] == 0x86) && (_checksum(ppm.data) == ppm.data.back()))
        {

            unsigned int value = ppm.data[2] * 256 + ppm.data[3];
            if (0 <= value && value <= 5000)
            {
                _co2 = value;
                _error = SENSOR_ERROR_OK;
            }
            else
            {
                _error = SENSOR_ERROR_OUT_OF_RANGE;
            }
        }
        else
        {
            _error = SENSOR_ERROR_CRC;
        }
    }

    double _co2 = 0;
    bool _calibrateAuto = false;
    // Stream* _serial { nullptr };
    SoftwareSerial *_serial = NULL;
};

#endif // SENSOR_SUPPORT && MHZ19_SUPPORT