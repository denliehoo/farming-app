// SPDX-License-Identifier: MIT
import "./IERC20.sol";
pragma solidity ^0.8.0;

contract FarmFactory {
    address public owner;
    address[] public lpTokens;
    IERC20 erc20;

    event PoolCreated(address pool);

    constructor() {
        owner = msg.sender;
    }

    function createPool(string memory _name, string memory _symbol) public onlyOwner returns (address) {
        address newPool = address(new LpToken(_name, _symbol));
        lpTokens.push(newPool);
        emit PoolCreated(newPool);
        return newPool;
    }

    function mintPoolTokens(
        uint256 _lpTokenNum,
        uint256 _amount,
        address _to
    ) public onlyOwner returns (bool) {
        require(_lpTokenNum < lpTokens.length, "Invalid Id");
        IERC20(lpTokens[_lpTokenNum]).mint(_to, _amount);
        return true;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
}

contract LpToken {
    string public name;
    string public symbol;
    address public owner;
    uint8 public constant decimals = 18;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
    event Mint(address indexed to, uint256 value);

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
        owner = msg.sender;
    }

    function transfer(address _to, uint256 _value) external returns (bool) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        require(_to != address(0), "Invalid recipient");

        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;

        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) external returns (bool) {
        allowance[msg.sender][_spender] = _value;

        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) external returns (bool) {
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(
            allowance[_from][msg.sender] >= _value,
            "Insufficient allowance"
        );
        require(_to != address(0), "Invalid recipient");

        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;

        emit Transfer(_from, _to, _value);
        return true;
    }

    function mint(
        address _to,
        uint256 _value
    ) external onlyOwner returns (bool) {
        require(_to != address(0), "Invalid recipient");

        balanceOf[_to] += _value;

        emit Transfer(address(0), _to, _value);
        emit Mint(_to, _value);
        return true;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can do this");
        _;
    }
}
