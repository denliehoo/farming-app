// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
    function transfer(address _to, uint256 _value) external returns (bool);

    function approve(address _spender, uint256 _value) external returns (bool);

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) external returns (bool);

    function balanceOf(address _owner) external view returns (uint256);

    function allowance(
        address _owner,
        address _spender
    ) external view returns (uint256);

    function mint(address _to, uint256 _value) external returns (bool); // Add mint function

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
    event Mint(address indexed to, uint256 value);
}
