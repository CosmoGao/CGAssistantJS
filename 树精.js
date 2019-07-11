var cga = require('./cgaapi')(function(){
	console.log('树精长老的末日 起始地点：艾尔莎岛')

	//initialize teammates array

	var playerinfo = cga.GetPlayerInfo();
	
	var teammates = [];
	
	var teamplayers = cga.getTeamPlayers();

	for(var i in teamplayers)
		teammates[i] = teamplayers[i].name;
	
	cga.isTeamLeader = (teammates[0] == playerinfo.name) ? true : false
	
	var waitStage = (cb2)=>{
		var teammate_state = {};
		var teammate_ready = 0;
		//var teamplayers = cga.getTeamPlayers();

		cga.waitTeammateSay((player, msg)=>{

			if(msg == '1' && teammate_state[player.name] !== true){
				teammate_state[player.name] = true;
				teammate_ready ++;
			}

			if(teammate_ready >= teamplayers.length){
				//all teammates are ready
				cb2(true);
				return false;
			}
			
			return true;
		});
	}

	var task = cga.task.Task('树精长老的末日', [
	{//0
		intro: '1.前往维诺亚村医院（61.53）与佣兵艾里克（7.5）对话，选“是”获得【火把】。',
		workFunc: function(cb2){
						
			var go_1 = ()=>{
				cga.TurnTo(7, 5);
				cga.AsyncWaitNPCDialog((dlg)=>{
					cga.ClickNPCDialog(4, 0);
					cga.AsyncWaitNPCDialog((dlg)=>{
						cga.ClickNPCDialog(1, 0);
						cga.SayWords('拿火把，完成请加队然后说“1”！', 0, 3, 1);
						setTimeout(()=>{
							cga.SayWords('1', 0, 3, 1);						
						}, 1500);
					});
				});
			}
						
			var go = ()=>{
				cga.walkList([
				[5, 1, '村长家的小房间'],
				[0, 5, '村长的家'],
				[10, 16, '维诺亚村'],
				[61, 53, '医院'],
				[6, 5],
				[5, 5],
				[6, 5],
				[5, 5],
				[6, 5],
				], ()=>{
					
					setTimeout(()=>{
						cga.DoRequest(cga.REQUEST_TYPE_LEAVETEAM);
						setTimeout(go_1, 1500);
					}, 1500);
					
					waitStage(cb2);
				});
			}
			
			var wait4 = ()=>{
				cga.addTeammate(teammates[0], (r)=>{
					if(r){
						cga.SayWords('1', 0, 3, 1);
						cb2(true);
						return;
					}
					setTimeout(wait4, 1000);
				});
			}
			
			var go2 = ()=>{

				var retry = ()=>{
					cga.TurnTo(7, 5);
					cga.AsyncWaitNPCDialog((dlg)=>{
						if(dlg instanceof TypeError){
							retry();
							return;
						}
						cga.ClickNPCDialog(4, 0);
						cga.AsyncWaitNPCDialog((dlg)=>{
							cga.ClickNPCDialog(1, 0);
							setTimeout(()=>{
								cga.WalkTo(5, 5);
								setTimeout(wait4, 1000);
							}, 1000);
						});
					});
				}

				cga.waitForLocation({mapname : '医院', walkto:[6, 5], pos: [7, 5], leaveteam : true}, retry);
			}
			
			var wait3 = ()=>{
				cga.addTeammate(teammates[0], (r)=>{
					if(r){
						go2();
						return;
					}
					setTimeout(wait3, 1000);
				});
			}
					
			var wait = ()=>{
				cga.WalkTo(4, 5);
				cga.waitTeammates(teammates, (r)=>{
					if(r){
						go();
						return;
					}
					setTimeout(wait, 1000);
				});
			}
			
			if(cga.isTeamLeader){
				cga.travel.falan.toWeiNuoYa(()=>{
					wait();
				});
			} else {
				var retry = ()=>{
					cga.TurnTo(8, 22);
					cga.AsyncWaitNPCDialog(function(dlg){
						if(dlg instanceof TypeError){
							cga.walkList([ [9, 23], [9, 22] ], retry);
							return;
						}
						cga.ClickNPCDialog(4, -1);
						setTimeout(wait3, 3000);
					});
				}
				
				cga.waitForLocation({mapname : '启程之间', pos : [8, 22], leaveteam : true}, retry);
			}
		}
	},
	{//1
		intro: '2.出维诺亚村向北行走至芙蕾雅岛（380.353）处，进入布满青苔的洞窟。3.通过随机迷宫抵达叹息之森林，与树精长老（29.13）对话，交出【火把】进入战斗。',
		workFunc: function(cb2){
			
			var waitBOSS = ()=>{
				if(cga.isInBattle())
				{
					setTimeout(waitBOSS, 1000);
					return;
				}
					
				setTimeout(cb2, 1000, true);
			}
			
			var fuckBOSS = ()=>{
				if(cga.isTeamLeader){
					cga.walkList([
					[29, 14],
					], ()=>{
						cga.TurnTo(29, 13);
						setTimeout(waitBOSS, 1500);
					});
				} else {
					if(cga.isInBattle())
					{
						setTimeout(waitBOSS, 1000);
						return;
					}
					setTimeout(fuckBOSS, 1500);
				}
			}
			
			var walkMaze = (cb3)=>{
				var map = cga.GetMapName();
				if(map == '叹息之森林'){
					cb3();
					return;
				}
				if(map == '芙蕾雅'){
					cb2('restart stage');
					return;
				}
				cga.walkRandomMaze(null, (err)=>{
					walkMaze(cb3);
				});
			}
			
			var go = ()=>{
				cga.walkList(
				(cga.GetMapName() == '芙蕾雅') ? 
				[
				[380, 353, '布满青苔的洞窟1楼'],
				]
				:
				[
				[2, 9, '维诺亚村'],
				[67, 47, '芙蕾雅'],
				[380, 353, '布满青苔的洞窟1楼'],
				]
				, ()=>{
					walkMaze(fuckBOSS);
				});
			}
			
			var go2 = ()=>{
				var name = cga.GetMapName();
				var pos = cga.GetMapXY();
				if(name == '叹息之森林' && (pos.x >= 25 && pos.x <= 29) && (pos.y >= 14 && pos.y <= 18)){
					fuckBOSS();
					return;
				}
				
				setTimeout(go2, 1000);
			}
			
			if(cga.isTeamLeader){
				go();
			} else {
				go2();
			}
		}
	},
	{//2
		intro: '4.战斗胜利后传送至叹息森林，队伍中随机1人获得【艾里克的大剑】。5.与年轻树精（26.12）对话，获得【树苗？】。',
		workFunc: function(cb2){
			var go = ()=>{
				cga.walkList([
				[27, 13],
				[26, 13],
				[27, 13],
				[26, 13],
				[27, 13],
				], ()=>{
					var swordItem = cga.findItem('艾里克的大剑');
					console.log('swordItem='+swordItem);
					if(swordItem != -1){
						cga.DropItem(swordItem);
					}
					setTimeout(()=>{
						cga.TurnTo(26, 12);
						cga.AsyncWaitNPCDialog((dlg)=>{
							cga.SayWords('拿到树苗后请自行完成后续任务！前往法兰城凯蒂夫人的店，鉴定树苗并将其交给维诺亚村村长的家“村长卡丹”，即可完成任务！', 0, 3, 1);
							setTimeout(cb2, 1000, true);
						});
					}, 1000);					
				});
			}
			
			var go2 = ()=>{
				var retry = ()=>{
					var swordItem = cga.findItem('艾里克的大剑');
					console.log('swordItem='+swordItem);
					if(swordItem != -1){
						cga.DropItem(swordItem);
					}
					setTimeout(()=>{
						cga.TurnTo(26, 12);
						cga.AsyncWaitNPCDialog((dlg)=>{
							if(dlg instanceof TypeError){
								cga.walkList([ [26, 13], [27, 13] ], retry);
								return;
							}
							if(cga.findItem('树苗？') == -1){
								setTimeout(retry, 1000);
							}
							setTimeout(cb2, 1000, true);
						});
					}, 1000);
				}
				
				cga.waitForLocation({mapname : '叹息森林', pos:[26, 12], walkto : [26, 13], leaveteam : true}, retry);
			}
			
			if(cga.isTeamLeader){
				go();
			} else {
				go2();
			}
		}
	},
	{//3
		intro: '6.前往法兰城凯蒂夫人的店（196.78）与凯蒂夫人（15.12）对话，交出30G将【树苗？】鉴定为【生命之花】。',
		workFunc: function(cb2){
			cga.travel.falan.toAssessStore(()=>{
				cga.walkList([
					[15, 12],
				], ()=>{
						var itemArray = cga.findItemArray('树苗？');
						cga.TurnTo(16, 12);
						cga.AsyncWaitNPCDialog(function(dlg){
							cga.SellNPCStore(itemArray);
							cga.AsyncWaitNPCDialog(function(dlg3){
								cb2(true);
							});
						});
				});
			});
		}
	},
	{//4
		intro: '7.前往维诺亚村村长的家（40.36）与村长卡丹（16.7）对话，选“是”交出【生命之花】获得晋阶资格，任务完结。',
		workFunc: function(cb2){
			cga.travel.falan.toWeiNuoYa(()=>{
				cga.walkList([
				[5, 1, '村长家的小房间'],
				[0, 5, '村长的家'],
				[15, 8],
				], ()=>{
					cga.TurnTo(16, 7);
					cga.AsyncWaitNPCDialog(function(dlg){
						cga.ClickNPCDialog(4, 0);
						cga.AsyncWaitNPCDialog(function(dlg3){
							cb2(true);
						});
					});
				});				
			});
		}
	},
	],
	[//任务阶段是否完成
		function(){
			return (cga.getItemCount('火把') >= 1) ? true : false;
		},
		function(){
			return (cga.GetMapName() == '叹息之森林') ? true : false;
		},
		function(){
			return (cga.getItemCount('树苗？') >= 1) ? true : false;
		},
		function(){
			return (cga.getItemCount('生命之花') >= 1) ? true : false;
		},
	]
	);
	
	task.doTask(()=>{
		console.log('ok');
	});
});