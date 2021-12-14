require('./common').then(async (cga) => {
    leo.baseInfoPrint();                    //显示基础信息
    leo.moveTimeout = 20;                  //遇敌速度
    leo.monitor.config.keepAlive = false;   //关闭防掉线
    leo.monitor.config.logStatus = false;   //关闭战斗状态提示
    //自动跟随队长换线，设置为true时，需要先提前与队长交换名片
    leo.monitor.config.autoChangeLineForLeader = false;
    var battleStatus = true;   //队长打印战斗明细
    leo.monitor.config.equipsProtect = false;   //关闭装备低耐久保护
    var usingpunchclock = false; //是否打卡

    let teams = [//自行修改角色名称，可以再加更多的队伍
        ['队长01','小号01','小号02','小号03','小号04'],
        ['队长02','小号05','小号06','小号07','小号08'],
        ['队长03','小号09','小号10','小号11','小号12'],
        ['队长04','小号13','小号14','小号15','小号16'],
        ['队长05','小号17','小号18','小号19','小号20'],
    ];

    let playerName = cga.GetPlayerInfo().name;
    let teammates = leo.findMyTeam(teams);
    if(teammates == null){
        await leo.log('红叶の石头脚本，未找到队伍，请确认配置是否正确')
        return leo.delay(1000*60*60*2);
    }else{
        await leo.log('红叶の石头脚本，推荐80~100级使用，启动~');
        await leo.log('我的队伍是：['+teammates.join(',')+']')
    }
    let teamLeader = teammates[0];
    let teamPlayerCount = teammates.length;
    let isTeamLeader = false;
    if (playerName == teamLeader) {
        isTeamLeader = true;
        await leo.log('我是队长，预设队伍人数【'+teamPlayerCount+'】');
        if(battleStatus){
            leo.battleMonitor.start(cga);
        }
    }else{
        await leo.log('我是队员，队长是【'+teamLeader+'】');
    }

    var protect = {
        //contactType遇敌类型：-1-旧遇敌，0-按地图自适应，1-东西移动，2-南北移动，
        //3-随机移动，4-画小圈圈，5-画中圈圈，6-画大圈圈，7-画十字，8-画8字
        contactType: 0,
        visible: false, 
        minHp: 500,
        minMp: 100,
        minPetHp: 150,
        minPetMp: 100,
        maxItemNumber: 21,
        minTeamNumber: teamPlayerCount,
        normalNurse: false
    };
    var isLogBackFirst = false; //启动登出
    var isPrepare = false; //招魂、治疗、补血、卖石
    var meetingPoint = 4; //集合点1~8
    var prepareOptions = {
        rechargeFlag: 1,
        repairFlag: -1,
        crystalName: '火风的水晶（5：5）',
        doctorName: '医道之殇'
    };
    var meetingPointTeamLeader = [
        [97, 85],
        [98, 85],
        [99, 85],
        [100, 85],
        [97, 83],
        [98, 83],
        [99, 83],
        [100, 83]
    ];
    var meetingPointTeammate = [
        [97, 86],
        [98, 86],
        [99, 86],
        [100, 86],
        [97, 84],
        [98, 84],
        [99, 84],
        [100, 84]
    ];
    
    cga.EnableFlags(cga.ENABLE_FLAG_TEAMCHAT, true); //开启队聊
    cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, true); //开启组队
    cga.EnableFlags(cga.ENABLE_FLAG_CARD, false); //关闭名片
    cga.EnableFlags(cga.ENABLE_FLAG_TRADE, false); //关闭交易
    if (isTeamLeader) {
        protect.minMp = 350; //队长是传教，回城魔值至少要大于等于一次祈祷的魔
    }
    
    var huizhang = () => {
        var huizhang = leo.getItems('矮人徽章');
        var jiuping = leo.getItems('巴萨的破酒瓶');
        if(huizhang.length > 0 || jiuping.length > 0){
            return leo.next();
        }else{
            return leo.autoWalkList([
                [116,56,'酒吧'],[14,7]
            ])
            .then(()=>leo.talkNpc(6,leo.talkNpcSelectorYes))
            .then(()=>leo.autoWalkList([[0,23,'圣骑士营地'],[97,85]]));
        }
    }


    leo.todo().then(() => {
        //登出
        if (isLogBackFirst) {
            return leo.logBack();
        } else {
            return leo.next();
        }
    }).then(() => {
        //招魂、治疗、补血、卖石
        if (isPrepare) {
            return leo.logBack().then(() => leo.prepare(prepareOptions));
        } else {
            return leo.next();
        }
    }).then(() => {
        return leo.loop(
            () => leo.waitAfterBattle()
            .then(() => leo.checkHealth(prepareOptions.doctorName))
            .then(() => leo.checkCrystal(prepareOptions.crystalName))
            .then(() => {
                //完成组队
                var teamplayers = cga.getTeamPlayers();
                if ((isTeamLeader && teamplayers.length >= protect.minTeamNumber)
                		|| (!isTeamLeader && teamplayers.length > 0)) {
                    //console.log('组队已就绪');
                    return leo.next();
                } else {
                    console.log(leo.logTime() + '寻找队伍');
                    return leo.todo()
                    .then(()=>{
                        if(usingpunchclock){
                            return leo.goto(n => n.castle.clock)
                            .then(()=>leo.talkNpc(2,leo.talkNpcSelectorYes));
                        }
                    })
                    .then(()=>leo.goto(n => n.camp.x))
                    .then(() => huizhang())
                    .then(() => {
                        if (isTeamLeader) {
                            cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, true); //开启组队
                            return leo.autoWalk(meetingPointTeamLeader[meetingPoint - 1]).then(() => leo.buildTeam(teamPlayerCount,teammates)).then(() => {
                                var teamplayers = leo.getTeamPlayerAll();
                                //console.log(teamplayers);
                                if (teamplayers && teamplayers.length == teamPlayerCount) {
                                    for (var i in teamplayers) {
                                        teammates[i] = teamplayers[i].name;
                                    }
                                }
                                leo.log('组队完成，队员[' + teammates.toString() + ']');
                                cga.EnableFlags(cga.ENABLE_FLAG_JOINTEAM, false); //关闭组队
                                return leo.next();
                            });
                        } else {
                            return leo.autoWalk(meetingPointTeammate[meetingPoint - 1])
                            .then(() => leo.enterTeamBlock(teamLeader));
                        }
                    });
                }
            }).then(() => {
                //营地练级
                if (isTeamLeader) {
                    var currentMap = cga.GetMapName();
                    var mapInfo = leo.getMapInfo();
                    if (currentMap == '艾尔莎岛') {
                        return leo.goto(n => n.camp.x)
                        .then(() => huizhang());
                    }

                    if (currentMap == '圣骑士营地') {
                        return leo.autoWalkList([
                            [87, 72, '工房'],
                            [20, 23]
                        ]).then(() => leo.walkList([
                            [20, 22],
                            [20, 23],
                            [20, 22]
                        ])).then(() => leo.sell(21, 23)).then(() => leo.delay(5000));
                    }
                    if (currentMap == '工房') {
                        return leo.autoWalkList([
                            [30, 37, '圣骑士营地'],
                            [95, 72, '医院']
                        ]);
                    }
                    if (currentMap == '医院') {
                        return leo.autoWalkList([
                            [9, 20]
                        ])
                        .then(() => leo.walkList([
                            [9, 11],
                            [9, 12],
                            [9, 11],
                            [9, 12]
                        ]))
                        .then(() => leo.supply(11, 11))
                        .then(() =>{
                            if(protect.normalNurse){//普通护士回补
                                return leo.autoWalk([18,15])
                                .then(()=>leo.walkList([
                                    [17,15],[18,15],[17,15],[18,15]
                                ]))
                                .then(()=>leo.supply(18, 14));
                            }
                        })
                        .then(() => leo.autoWalkList([
                            [0, 20, '圣骑士营地'],
                            [36, 87, '肯吉罗岛'],
                            [547, 332]
                        ]));
                    }
                    if (currentMap == '肯吉罗岛') {
                        return leo.autoWalkList([
                            [384, 245,'蜥蜴洞穴'],[12, 2,'肯吉罗岛'],[231,434,'矮人城镇']
                        ]);
                    }
                    if (currentMap == '矮人城镇' && mapInfo.x > 93) {
                        return leo.autoWalkList([
                            [163, 95]
                        ])
                        .then(() => leo.supplyDir(0))
                        .then(() => leo.delay(2000))
                        .then(() => leo.statistics(leo.beginTime, leo.oldXp))   //打印统计信息
                        .then(() => leo.autoWalk([97,124]))
                        .then(() => leo.talkNpc(4,leo.talkNpcSelectorYes))
                    }
                    if (currentMap == '矮人城镇' && mapInfo.x < 93) {
                        console.log(leo.logTime() + '开始战斗');
                        return leo.autoWalk([61,129])
                        .then(() => leo.encounterTeamLeader(protect))  //队长遇敌
                        .then(() => leo.delay(2000))
                        .then(() => {
                            console.log(leo.logTime() + "触发回补");
                            return leo.autoWalk([92, 125,[101,131]]).then(() => leo.delay(2000));
                        });
                    }
                } else {
                    var mapInfo = leo.getMapInfo();
                    if (mapInfo.name == '工房' && mapInfo.x == 20 && (mapInfo.y == 22 || mapInfo.y == 23)) {
                        return leo.sell(21, 23).then(() => leo.delay(10000));
                    }
                    if (mapInfo.name == '医院' && mapInfo.x == 9 && (mapInfo.y == 11 || mapInfo.y == 12)) {
                        return leo.supply(11, 11);
                    }
                    if (mapInfo.name == '矮人城镇' && mapInfo.x < 93) {
                        return leo.encounterTeammate(protect,()=>{
                            mapInfo = leo.getMapInfo();
                            if(mapInfo.x > 93) return true;
                        }); //队员遇敌
                    }
                    if (mapInfo.name == '矮人城镇' && mapInfo.x > 150) {
                        return leo.statistics(leo.beginTime, leo.oldXp)
                        .then(()=>leo.delay(20000)); //打印统计信息
                    }
                }
                //console.log('延时3秒');
                return leo.delay(3000);
            }).
            catch (console.log)
        );
    });
});