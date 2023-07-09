// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./FarmToken.sol";
import "./IERC20.sol";

contract FarmMasterChef {
    struct UserInfo {
        uint256 amount; // How many LP tokens the user has provided.
        uint256 rewardDebt;
    }

    struct PoolInfo {
        IERC20 lpToken; // Address of LP token contract.
        uint256 allocPoint; // How many allocation points assigned to this pool. farms to distribute per block.
        uint256 lastRewardBlock; // Last block number that farms distribution occurs.
        uint256 accFarmPerShare; // Accumulated FARMs per share, times 1e12 (for more precision)
    }

    FarmToken public farm;
    // farm tokens created per block.
    uint256 public farmPerBlock = 200 * 10 ** 18; // 200 Farm tokens per block

    // Info of each pool.
    PoolInfo[] public poolInfo;
    // Info of each user that stakes LP tokens.
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    // Total allocation points in all pools.
    uint256 public totalAllocPoint = 0;
    address public owner;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(
        address indexed user,
        uint256 indexed pid,
        uint256 amount
    );

    constructor(FarmToken _farm) {
        farm = _farm; // FarmToken Address
        owner = msg.sender;
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    // Add a new lp to the pool.
    // DO NOT add the same LP token more than once.
    function add(
        uint256 _allocPoint,
        IERC20 _lpToken,
        bool _withUpdate
    ) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock = block.number;
        totalAllocPoint += _allocPoint;
        poolInfo.push(
            PoolInfo({
                lpToken: _lpToken,
                allocPoint: _allocPoint,
                lastRewardBlock: lastRewardBlock,
                accFarmPerShare: 0
            })
        );
    }

    // Update the given pool's farm allocation point.
    function set(
        uint256 _pid,
        uint256 _allocPoint,
        bool _withUpdate
    ) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        require(
            totalAllocPoint >= poolInfo[_pid].allocPoint,
            "Pool's allocPoint is greater than total"
        );
        totalAllocPoint =
            totalAllocPoint -
            (poolInfo[_pid].allocPoint) +
            (_allocPoint);
        poolInfo[_pid].allocPoint = _allocPoint;
    }

    // View function to see pending farms on frontend.
    function pendingFarm(
        uint256 _pid,
        address _user
    ) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accFarmPerShare = pool.accFarmPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 farmReward = (farmPerBlock * (pool.allocPoint)) /
                (totalAllocPoint);
            accFarmPerShare += ((farmReward * (1e12)) / (lpSupply));
        }
        return (user.amount * accFarmPerShare) / 1e12 - user.rewardDebt;
    }

    // Update reward vairables for all pools. Be careful of gas spending!
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 farmReward = (farmPerBlock * (pool.allocPoint)) /
            (totalAllocPoint);

        farm.mint(address(this), farmReward);
        pool.accFarmPerShare += (farmReward * 1e12) / lpSupply;
        pool.lastRewardBlock = block.number;
    }

    // Deposit LP tokens to MasterChef to earn FARM Tokens
    function deposit(uint256 _pid, uint256 _amount) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        updatePool(_pid);
        if (user.amount > 0) {
            uint256 pending = ((user.amount * pool.accFarmPerShare) / 1e12) -
                user.rewardDebt;
            safeFarmTransfer(msg.sender, pending);
        }
        pool.lpToken.transferFrom(address(msg.sender), address(this), _amount);
        user.amount += (_amount);
        user.rewardDebt = (user.amount * (pool.accFarmPerShare)) / (1e12);
        emit Deposit(msg.sender, _pid, _amount);
    }

    // Withdraw LP tokens from MasterChef.
    // If only want to "claim" rewards, put _amount as 0.
    // Note: Whenever withdraw function is called, users will receive their rewards too
    // regardless of the amount that they withdraw
    function withdraw(uint256 _pid, uint256 _amount) public {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "Withdraw amount greater than deposited amount");
        updatePool(_pid);
        uint256 pending = (user.amount * (pool.accFarmPerShare)) /
            (1e12) -
            (user.rewardDebt);
        safeFarmTransfer(msg.sender, pending);
        user.amount -= (_amount);
        user.rewardDebt = (user.amount * (pool.accFarmPerShare)) / (1e12);
        pool.lpToken.transfer(address(msg.sender), _amount);
        emit Withdraw(msg.sender, _pid, _amount);
    }

    // Safe farm transfer function, just in case if rounding error causes pool to not have enough farms.
    function safeFarmTransfer(address _to, uint256 _amount) internal {
        uint256 farmBal = farm.balanceOf(address(this));
        if (_amount > farmBal) {
            farm.transfer(_to, farmBal);
        } else {
            farm.transfer(_to, _amount);
        }
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can do this");
        _;
    }
}