from group_theory import *
from optimal_path import *

if __name__ == "__main__":
    tc = three_clusters() 
    sq = square_cycles() 
    tc_table = [[{} for j in range(8)] for i in range(8)] 

    for state in xrange(8):
        for goal in xrange(8):
            if state == goal:
                continue
            solution_paths = BFS(state, goal, tc) 
            optimal_path_length = len(solution_paths[0]) 
            if optimal_path_length == 1:
                tc_table[state][goal] = {"X90": 1,
                                         "X80": 1,
                                         "X70": 1,
                                         "X60": 2,
                                         "X50": 2,
                                         "X40": 2,
                                         "X30": 4,
                                         "X20": 5,
                                         "X10": 6}
            elif optimal_path_length == 2:
                tc_table[state][goal] = {"X90": 2,
                                         "X80": 2.5,
                                         "X70": 3,
                                         "X60": 3.5,
                                         "X50": 4,
                                         "X40": 4.5,
                                         "X30": 5,
                                         "X20": 5.5,
                                         "X10": 6}
            elif optimal_path_length == 3:
                tc_table[state][goal] = {"X90": 3,
                                         "X80": 3.5,
                                         "X70": 4,
                                         "X60": 4.5,
                                         "X50": 5,
                                         "X40": 6,
                                         "X30": 7,
                                         "X20": 8,
                                         "X10": 10}
            elif optimal_path_length == 4:
                tc_table[state][goal] = {"X90": 4,
                                         "X80": 4.5,
                                         "X70": 5,
                                         "X60": 6,
                                         "X50": 7,
                                         "X40": 8,
                                         "X30": 9,
                                         "X20": 10,
                                         "X10": 11}

    sq_table = [[{} for j in range(8)] for i in range(8)] 
    for state in xrange(8):
        for goal in xrange(8):
            if state == goal:
                continue
            solution_paths = BFS(state, goal, sq) 
            optimal_path_length = len(solution_paths[0]) 
            if optimal_path_length == 1:
                sq_table[state][goal] = {"X90": 1,
                                         "X80": 1,
                                         "X70": 1,
                                         "X60": 2,
                                         "X50": 2,
                                         "X40": 2,
                                         "X30": 4,
                                         "X20": 5,
                                         "X10": 6}
            elif optimal_path_length == 2:
                sq_table[state][goal] = {"X90": 2,
                                         "X80": 2.5,
                                         "X70": 3,
                                         "X60": 3.5,
                                         "X50": 4,
                                         "X40": 4.5,
                                         "X30": 5,
                                         "X20": 5.5,
                                         "X10": 6}
            elif optimal_path_length == 3:
                sq_table[state][goal] = {"X90": 3,
                                         "X80": 3.5,
                                         "X70": 4,
                                         "X60": 4.5,
                                         "X50": 5,
                                         "X40": 6,
                                         "X30": 7,
                                         "X20": 8,
                                         "X10": 10}
            elif optimal_path_length == 4:
                sq_table[state][goal] = {"X90": 4,
                                         "X80": 4.5,
                                         "X70": 5,
                                         "X60": 6,
                                         "X50": 7,
                                         "X40": 8,
                                         "X30": 9,
                                         "X20": 10,
                                         "X10": 11}

    with open("../../web/distributions/three_clusters.json", "w") as fout:
        fout.write(str(tc_table).replace("'", '"'))
    with open("../../web/distributions/square_cycles.json", "w") as fout:
        fout.write(str(sq_table).replace("'", '"'))

