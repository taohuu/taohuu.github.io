function calc()  {
	                var a=document.getElementById("num_a").value;
                    var b=document.getElementById("num_b").value;
                    var c=document.getElementById("num_c").value;

                    var x1,x2,xResult;
                    var d=b*b-4*a*c;

                    if(d>0) { x1=(-b+Math.sqrt(d))/(2*a);
                              x2=(-b-Math.sqrt(d))/(2*a);
                              x1=parseFloat(x1.toFixed(5));
                              x2=parseFloat(x2.toFixed(5));
                             xResult="x1="+x1+",x2="+x2;}
                    
                    else if (d=0) { x1=(-b)/(2*a);
                    	          x1=parseFloat(x1.toFixed(5));
                                  xResult="x1=x2="+x1;}

                    else {xResult="无实数根";}

                    document.getElementById("result").value=xResult;

                   }


function init()   {
	                var today=new Date();
	                var year=today.getFullYear();
	                var month=today.getMonth();
	                var day=today.getDate();
	                var hour=today.getHours();
	                var minute=today.getMinutes();

	                var time_str="现在是："+year +"年" +(month+1)+"月"+day+"日&nbsp;"+hour
	                    +((minute>9)?":":":0")+minute ;


	                     switch(true) {case (hour>=4 && hour<9): time_str+="&nbsp;&nbsp;早安！";
	                                       break;
	                                   case (hour>=9 && hour<11): time_str+="&nbsp;&nbsp;上午好！";
	                                       break;
	                                   case (hour>=11 && hour<13): time_str+="&nbsp;&nbsp;中午好！";
	                                       break;
	                                   case (hour>=13 && hour<18): time_str+="&nbsp;&nbsp;下午好！";
	                                       break;
	                                   case (hour>=18 && hour<20): time_str+="&nbsp;&nbsp;傍晚好！";
	                                       break;
	                                   case (hour>=20 && hour<=23): time_str+="&nbsp;&nbsp;晚上好！";
	                                       break;
	                                   case (hour>=0 && hour<4): time_str+="&nbsp;&nbsp;很晚了，快休息吧！";
	                                       break;
	                                   default:time_str+="&nbsp；你好！";}

	               
	               
	               document.getElementById("time").innerHTML=time_str;

	               setTimeout("init()",1000);
	              


                    }

function mv_time(){  var wd= parseInt(document.getElementById("time").clientWidth);
                     setTimeout("mv_time()",20);
                     if(left_f< wd)
                        { left_d++; 
                          left_f++;  
                          document.getElementById("time").style.left=-left_d+"px";              
                        }

                     else if(left_f>=wd && left_f<2*wd)
                        {
                         left_d--;
                         left_f++;  
                         document.getElementById("time").style.left=left_d+"px";

                         }
                     else left_f=0;

                    }

                      


var left_d = 0;
var left_f=0;
var stop_time=3000;
var scoll_time=10;
var top_d=0;
var height_px=30;


function move (){
	           
                document.getElementById("lis1").style.top=top_d+"px" ;
                if(top_d>-150)
                    {if(height_px!=0)
                    	{top_d--;
                    	 height_px--;
                    	 setTimeout("move()",scoll_time);
                         }

                     else{height_px=30;
                     	  setTimeout ("move()",stop_time);
                          }

                    }

                else  {top_d=0;
                	   setTimeout("move()",stop_time);
                	   }


	            
                } 