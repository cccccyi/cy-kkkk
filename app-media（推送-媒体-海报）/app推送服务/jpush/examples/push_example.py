# -*- coding: utf-8 -*-
from conf import app_key, master_secret
import jpush

def alias():
    push = _jpush.create_push()
    alias=["alias1", "alias2"]
    alias1={"alias": alias}
    print(alias1)
    push.audience = jpush.audience(
        jpush.tag("tag1", "tag2"),
        alias1
    )

    push.notification = jpush.notification(alert="Hello world with audience!")
    push.platform = jpush.all_
    print (push.payload)
    push.send()

def all():
    push = _jpush.create_push()
    push.audience = jpush.all_
    push.notification = jpush.notification(alert="!hello python jpush api")
    push.platform = jpush.all_
    try:
        response=push.send()
    except common.Unauthorized:
        raise common.Unauthorized("Unauthorized")
    except common.APIConnectionException:
        raise common.APIConnectionException("conn")
    except common.JPushFailure:
        print ("JPushFailure")
    except:
        print ("Exception")

def audience():
    push = _jpush.create_push()

    push.audience = jpush.audience(
                jpush.tag("tag1", "tag2"),
                jpush.alias("alias1", "alias2")
            )


    push.notification = jpush.notification(alert="Hello world with audience!")

    push.platform = jpush.all_
    print (push.payload)
    push.send()

def audience_registration_ids():
    push = _jpush.create_push()

    ids = ["18171adc0230495ae6d"]
    registration_ids = {"registration_id": ids}
    push.audience = jpush.audience(
                registration_ids
            )


    title = 'Base游戏启动平台Uptopia完成400万美元融资，Pantera Capital领投'
    content = '哈世链闻消息，Base链生态游戏启动平台Uptopia宣布完成400万美元融资，Pantera Capital领投，Spartan和Coinbase Ventures等参与投资。同时，官方计划于6月18日正式升级推出The Factory。'
    uniqCode = 'WKalEBOgfY'

    ios_msg = jpush.ios(alert={"title": title, "body": content}, badge="+1", extras={'newsid': uniqCode})
    android_msg = jpush.android(alert=title)
    push.notification = jpush.notification(android=android_msg, ios=ios_msg)

    push.platform = jpush.all_
    print (push.payload)
    push.send()


def notification():
    push = _jpush.create_push()

    push.audience = jpush.all_
    push.platform = jpush.all_

    ios = jpush.ios(alert="Hello, IOS JPush!", sound="a.caf", extras={'k1':'v1'})
    android = jpush.android(alert="Hello, Android msg", priority=1, style=1, alert_type=1,big_text='jjjjjjjjjj', extras={'k1':'v1'})
    hmos = jpush.hmos(alert="Hello, HMOS JPush!", category="category", large_icon="large_icon", intent={"url":"action.system.home"}, extras={'k1':'v1'}, style="style", inbox="inbox")

    push.notification = jpush.notification(alert="Hello, JPush!", android=android, ios=ios, hmos=hmos)

    # pprint (push.payload)
    result = push.send()

def options():
    push = _jpush.create_push()
    push.audience = jpush.all_
    push.notification = jpush.notification(alert="Hello, world!")
    push.platform = jpush.all_
    push.options = {"time_to_live":86400, "sendno":12345,"apns_production":True}
    push.send()

def platfrom_msg():
    push = _jpush.create_push()
    push.audience = jpush.all_
    ios_msg = jpush.ios(alert="Hello, IOS JPush!", badge="+1", sound="a.caf", extras={'k1':'v1'})
    android_msg = jpush.android(alert="Hello, android msg")
    hmos_msg = jpush.hmos(alert="Hello, HMOS JPush msg")
    push.notification = jpush.notification(alert="Hello, JPush!", android=android_msg, ios=ios_msg, hmos=hmos_msg)
    push.message=jpush.message("content",extras={'k2':'v2','k3':'v3'})
    push.platform = jpush.all_
    push.send()


def silent():
    push = _jpush.create_push()
    push.audience = jpush.all_
    ios_msg = jpush.ios(alert="Hello, IOS JPush!", badge="+1", extras={'k1':'v1'}, sound_disable=True)
    android_msg = jpush.android(alert="Hello, android msg")
    hmos_msg = jpush.hmos(alert="Hello, HMOS JPush msg")
    push.notification = jpush.notification(alert="Hello, JPush!", android=android_msg, ios=ios_msg, hmos=hmos_msg)
    push.platform = jpush.all_
    push.send()


def sms():
    push = _jpush.create_push()
    push.audience = jpush.all_
    push.notification = jpush.notification(alert="a sms message from python jpush api")
    push.platform = jpush.all_
    push.smsmessage=jpush.smsmessage("a sms message from python jpush api",0)
    print (push.payload)
    push.send()

def validate():
    push = _jpush.create_push()
    push.audience = jpush.all_
    push.notification = jpush.notification(alert="Hello, world!")
    push.platform = jpush.all_
    push.send_validate()

_jpush = jpush.JPush(app_key, master_secret)
_jpush.set_logging("DEBUG")
audience_registration_ids()