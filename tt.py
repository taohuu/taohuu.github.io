# -*- coding: utf-8 -*-

# 用二维列表表示棋盘
board = [[" " for _ in range(15)] for _ in range(15)]

# 用字典表示黑白棋
pieces = {"black": "●", "white": "○"}

# 用变量表示当前玩家和对手
player = "black"
opponent = "white"

# 定义一个函数，打印棋盘
def print_board():
    # 打印列号
    print("   ", end="")
    for i in range(15):
        print(f"{i+1:2d}", end=" ")
    print()
    # 打印行号和棋子
    for i in range(15):
        print(f"{i+1:2d} ", end="")
        for j in range(15):
            print(board[i][j], end="  ")
        print()

# 定义一个函数，判断是否有五子连珠
def check_win(x, y):
    # 获取当前位置的棋子
    piece = board[x][y]
    # 定义四个方向的偏移量
    directions = [(0, 1), (1, 0), (1, 1), (1, -1)]
    # 遍历四个方向
    for dx, dy in directions:
        # 初始化计数器为1
        count = 1
        # 向前搜索相同的棋子，直到边界或不同的棋子为止
        i = x + dx
        j = y + dy
        while 0 <= i < 15 and 0 <= j < 15 and board[i][j] == piece:
            count += 1
            i += dx
            j += dy
        # 向后搜索相同的棋子，直到边界或不同的棋子为止    
        i = x - dx
        j = y - dy    
        while 0 <= i < 15 and 0 <= j < 15 and board[i][j] == piece:
            count += 1 
            i -= dx 
            j -= dy 
        # 如果计数器达到5，说明有五子连珠，返回True    
        if count >= 5:
            return True 
    # 如果没有任何方向有五子连珠，返回False        
    return False 

# 定义一个函数，获取用户输入的坐标，并检查是否合法    
def get_input():
    while True:
        try:
            # 获取用户输入的字符串，并分割成两个数字            
            x_str, y_str = input(f"请输入{player}方下棋位置（如：8,8）：").split(",")
            # 将字符串转换成整数，并减一以适应列表索引            
            x = int(x_str) - 1 
            y = int(y_str) - 1 
            # 检查坐标是否在范围内，并且该位置没有被占用            
            if not (0 <= x < 15 and 0 <= y < 15):
                raise ValueError("坐标超出范围，请重新输入！")
            if board[x][y] != " ":
                raise ValueError("该位置已经有棋子，请重新输入！")
            # 如果一切正常，返回坐标            
            return x, y 
        except ValueError as e:
            # 如果出现错误，打印错误信息，并继续循环            
            print(e)

# 开始游戏循环        
while True:
    # 打印当前的棋盘    
    print_board()
    # 获取用户输入的坐标    
    x, y = get_input()
    # 在对应位置放置当前玩家的棋子    
    board[x][y] = pieces[player]
    # 检查是否有五子连
